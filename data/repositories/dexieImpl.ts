
import { db } from '../db/dexie';
import { IProductRepository, IPartnerRepository, IInvoiceRepository, ICashRepository, IExpenseRepository, ICategoryRepository } from './interfaces';
import { Product, ProductBarcode, Partner, Invoice, InvoiceItem, StockMovement, CashTransaction, SyncStatus, CashSession, CashSessionStatus, Expense, Category } from '../../types';
import { generateId } from '../../lib/utils';

export const ProductRepository: IProductRepository = {
  async getAll(orgId: string) {
    return await db.products.where('org_id').equals(orgId).toArray();
  },

  async getById(id: string) {
    return await db.products.get(id);
  },

  async getByBarcode(orgId: string, barcode: string) {
    const pb = await db.product_barcodes.where('[org_id+barcode]').equals([orgId, barcode]).first();
    if (pb) {
      return await db.products.get(pb.product_id);
    }
    return undefined;
  },

  async create(product: Product, barcodes: ProductBarcode[]) {
    await (db as any).transaction('rw', db.products, db.product_barcodes, async () => {
      await db.products.add(product);
      if (barcodes.length > 0) {
        await db.product_barcodes.bulkAdd(barcodes);
      }
    });
  },

  async update(product: Product) {
    await db.products.put(product);
  },

  async updateStock(id: string, delta: number) {
    const product = await db.products.get(id);
    if (product) {
      await db.products.update(id, { stock: (product.stock || 0) + delta });
    }
  }
};

export const CategoryRepository: ICategoryRepository = {
  async getAll(orgId: string) {
    return await db.categories.where('org_id').equals(orgId).toArray();
  },
  async create(category: Category) {
    await db.categories.add(category);
  },
  async update(category: Category) {
    await db.categories.put(category);
  }
};

export const PartnerRepository: IPartnerRepository = {
  async getAll(orgId: string, type?) {
    let collection = db.partners.where('org_id').equals(orgId);
    if (type) {
      collection = collection.filter(p => p.type === type);
    }
    return await collection.toArray();
  },

  async create(partner: Partner) {
    await db.partners.add(partner);
  },

  async update(partner: Partner) {
    await db.partners.put(partner);
  },

  async updateBalance(id: string, delta: number) {
    const partner = await db.partners.get(id);
    if (partner) {
      await db.partners.update(id, { balance: (partner.balance || 0) + delta });
    }
  }
};

export const InvoiceRepository: IInvoiceRepository = {
  async getAll(orgId: string) {
    return await db.invoices.where('org_id').equals(orgId).reverse().sortBy('date');
  },

  async getById(id: string) {
    return await db.invoices.get(id);
  },

  async create(invoice: Invoice, items: InvoiceItem[]) {
    await (db as any).transaction('rw', db.invoices, db.invoice_items, db.products, db.stock_movements, db.partners, db.cash_transactions, db.cash_sessions, async () => {
      
      // 1. Save Invoice Header
      await db.invoices.add(invoice);
      
      // 2. Save Items
      await db.invoice_items.bulkAdd(items);

      // 3. Determine Stock Direction
      let stockMultiplier = -1; // SALE
      if (invoice.type === 'PURCHASE') stockMultiplier = 1;
      if (invoice.type === 'SALE_RETURN') stockMultiplier = 1;
      if (invoice.type === 'PURCHASE_RETURN') stockMultiplier = -1;

      // 4. Update Stock
      for (const item of items) {
        const qtyChange = item.qty * stockMultiplier;
        const movement: StockMovement = {
          id: generateId(),
          org_id: invoice.org_id,
          warehouse_id: invoice.warehouse_id,
          product_id: item.product_id,
          qty: qtyChange,
          type: invoice.type,
          ref_id: invoice.id,
          created_at: new Date().toISOString(),
          sync_status: SyncStatus.PENDING
        };
        await db.stock_movements.add(movement);
        
        const product = await db.products.get(item.product_id);
        if (product) {
          const currentStock = product.stock || 0;
          await db.products.update(item.product_id, { stock: currentStock + qtyChange });
        }
      }

      // 5. Update Partner Balance
      if (invoice.partner_id && invoice.payment_method !== 'CASH') {
        const remaining = invoice.grand_total - invoice.paid_amount;
        if (remaining > 0) {
           const partner = await db.partners.get(invoice.partner_id);
           if (partner) {
             await db.partners.update(invoice.partner_id, { balance: (partner.balance || 0) + remaining });
           }
        }
      }
      
      // 6. Cash Transaction (if Paid Amount > 0)
      if (invoice.paid_amount > 0) {
        // Find active session
        const activeSession = await db.cash_sessions
          .where('status').equals(CashSessionStatus.OPEN)
          .first();

        const isIncome = invoice.type === 'SALE' || invoice.type === 'PURCHASE_RETURN';
        
        const cashTx: CashTransaction = {
          id: generateId(),
          org_id: invoice.org_id,
          session_id: activeSession?.id || 'NO_SESSION', 
          amount: invoice.paid_amount,
          type: isIncome ? 'IN' : 'OUT',
          description: `فاتورة ${invoice.invoice_number}`,
          ref_id: invoice.id,
          created_at: new Date().toISOString(),
          sync_status: SyncStatus.PENDING
        };
        await db.cash_transactions.add(cashTx);
      }
    });
  }
};

export const CashRepository: ICashRepository = {
  async getCurrentSession(userId: string) {
    // We filter by status OPEN. In a real app, also filter by userId if multiple users per device.
    return await db.cash_sessions
      .where('status').equals(CashSessionStatus.OPEN)
      .first();
  },

  async openSession(session: CashSession) {
    await db.cash_sessions.add(session);
    // Initial transaction for opening amount
    if (session.opening_amount > 0) {
      await db.cash_transactions.add({
        id: generateId(),
        org_id: session.org_id,
        session_id: session.id,
        amount: session.opening_amount,
        type: 'IN',
        description: 'رصيد افتتاحي',
        created_at: session.opened_at,
        sync_status: SyncStatus.PENDING
      });
    }
  },

  async closeSession(id: string, closingData: { closing_amount: number; variance: number; closed_at: string }) {
    await db.cash_sessions.update(id, {
      status: CashSessionStatus.CLOSED,
      closing_amount: closingData.closing_amount,
      variance: closingData.variance,
      closed_at: closingData.closed_at,
      sync_status: SyncStatus.PENDING
    });
  },

  async addTransaction(transaction: CashTransaction) {
    await db.cash_transactions.add(transaction);
  },

  async getSessionTransactions(sessionId: string) {
    return await db.cash_transactions.where('session_id').equals(sessionId).toArray();
  }
};

export const ExpenseRepository: IExpenseRepository = {
  async getAll(orgId: string) {
    return await db.expenses.where('org_id').equals(orgId).reverse().sortBy('date');
  },

  async create(expense: Expense) {
    await (db as any).transaction('rw', db.expenses, db.cash_transactions, db.cash_sessions, async () => {
      // 1. Add Expense Record
      await db.expenses.add(expense);

      // 2. Find active session to deduct money
      const activeSession = await db.cash_sessions
        .where('status').equals(CashSessionStatus.OPEN)
        .first();
      
      if (!activeSession) {
        // Option: Allow expense but warn? For now, we allow it but label session NO_SESSION
        // Or throw error: throw new Error("No active shift");
      }

      // 3. Create Cash OUT Transaction
      const cashTx: CashTransaction = {
        id: generateId(),
        org_id: expense.org_id,
        session_id: activeSession?.id || 'NO_SESSION',
        amount: expense.amount,
        type: 'OUT',
        description: `مصروف: ${expense.category} - ${expense.description}`,
        ref_id: expense.id,
        created_at: new Date().toISOString(),
        sync_status: SyncStatus.PENDING
      };
      await db.cash_transactions.add(cashTx);
    });
  }
};

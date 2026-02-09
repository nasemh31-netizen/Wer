
import Dexie, { Table } from 'dexie';
import { 
  Product, 
  ProductBarcode, 
  Partner, 
  Invoice, 
  InvoiceItem, 
  Warehouse, 
  CashSession, 
  StockMovement, 
  CashTransaction,
  Expense,
  Category,
  User
} from '../../types';

export class MicroPOSDatabase extends Dexie {
  // Master Data
  users!: Table<User>;
  products!: Table<Product>;
  product_barcodes!: Table<ProductBarcode>;
  categories!: Table<Category>;
  partners!: Table<Partner>;
  warehouses!: Table<Warehouse>;

  // Transactions
  invoices!: Table<Invoice>;
  invoice_items!: Table<InvoiceItem>;
  stock_movements!: Table<StockMovement>;
  expenses!: Table<Expense>;
  
  // Cash Management
  cash_sessions!: Table<CashSession>;
  cash_transactions!: Table<CashTransaction>;

  // Sync Queue
  outbox!: Table<{
    id: number;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: any;
    created_at: number;
  }>;

  constructor() {
    super('MicroPOS_DB');
    
    (this as any).version(3).stores({
      // Master Data
      users: 'id, org_id, username, sync_status',
      products: 'id, org_id, category_id, name, sync_status',
      product_barcodes: 'id, org_id, product_id, barcode, sync_status, [org_id+barcode]',
      categories: 'id, org_id, name, sync_status',
      partners: 'id, org_id, type, name, sync_status',
      warehouses: 'id, org_id, sync_status',
      
      // Transactions
      invoices: 'id, org_id, invoice_number, status, type, date, sync_status',
      invoice_items: 'id, invoice_id',
      stock_movements: 'id, org_id, product_id, warehouse_id, sync_status',
      expenses: 'id, org_id, date, category, sync_status',
      
      // Cash
      cash_sessions: 'id, org_id, user_id, status, sync_status',
      cash_transactions: 'id, org_id, session_id, sync_status',
      
      // Sync
      outbox: '++id, table_name'
    });
  }
}

export const db = new MicroPOSDatabase();

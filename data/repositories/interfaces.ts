
import { Product, ProductBarcode, Invoice, Partner, CashSession, StockMovement, CashTransaction, Expense, Category } from '../../types';

export interface IProductRepository {
  getAll(orgId: string): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  getByBarcode(orgId: string, barcode: string): Promise<Product | undefined>;
  create(product: Product, barcodes: ProductBarcode[]): Promise<void>;
  update(product: Product): Promise<void>;
  updateStock(id: string, delta: number): Promise<void>;
}

export interface ICategoryRepository {
  getAll(orgId: string): Promise<Category[]>;
  create(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
}

export interface IPartnerRepository {
  getAll(orgId: string, type?: 'CUSTOMER' | 'SUPPLIER'): Promise<Partner[]>;
  create(partner: Partner): Promise<void>;
  update(partner: Partner): Promise<void>;
  updateBalance(id: string, delta: number): Promise<void>;
}

export interface IInvoiceRepository {
  create(invoice: Invoice, items: any[]): Promise<void>; // Needs proper typing for items
  getById(id: string): Promise<Invoice | undefined>;
  getAll(orgId: string): Promise<Invoice[]>;
}

export interface ICashRepository {
  getCurrentSession(userId: string): Promise<CashSession | undefined>;
  openSession(session: CashSession): Promise<void>;
  closeSession(id: string, closingData: any): Promise<void>;
  addTransaction(transaction: any): Promise<void>;
  getSessionTransactions(sessionId: string): Promise<CashTransaction[]>;
}

export interface IExpenseRepository {
  getAll(orgId: string): Promise<Expense[]>;
  create(expense: Expense): Promise<void>;
}

export interface ISyncRepository {
  push(): Promise<void>;
  pull(): Promise<void>;
  getPendingCount(): Promise<number>;
}

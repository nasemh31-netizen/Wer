
export enum AppRoute {
  HOME = 'HOME',
  SALES = 'SALES',
  PURCHASES = 'PURCHASES',
  CUSTOMERS = 'CUSTOMERS',
  SUPPLIERS = 'SUPPLIERS',
  CASHBOX = 'CASHBOX',
  EXPENSES = 'EXPENSES',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  LOGIN = 'LOGIN'
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  ERROR = 'ERROR'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  RETURNED = 'RETURNED',
  CANCELED = 'CANCELED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  CARD = 'CARD',
  CHECK = 'CHECK',
  MIXED = 'MIXED'
}

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  reference?: string; // Auth code for cards, Check number
}

export enum PartnerType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER'
}

export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

// Entities matching DB Schema

export interface User {
  id: string;
  org_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  pin_code?: string;
  is_active: boolean;
  sync_status?: SyncStatus;
}

export interface Organization {
  id: string;
  name: string;
  tax_number?: string;
  currency: string;
}

export interface Warehouse {
  id: string;
  org_id: string;
  name: string;
  is_active: boolean;
  sync_status?: SyncStatus;
}

export interface Category {
  id: string;
  org_id: string;
  name: string;
  sync_status?: SyncStatus;
}

export interface Product {
  id: string;
  org_id: string;
  category_id?: string;
  name: string;
  sku?: string;
  cost: number;
  price: number;
  tax_rate: number; // 0.15 for 15%
  min_stock: number;
  is_active: boolean;
  is_stock_tracking: boolean;
  // Computed/UI fields
  stock?: number; 
  barcodes?: string[]; 
  sync_status?: SyncStatus;
}

export interface ProductBarcode {
  id: string;
  org_id: string;
  product_id: string;
  barcode: string;
  is_primary: boolean;
  unit_type?: string; // 'PIECE', 'CARTON', 'BOX', etc.
  factor?: number; // 1 for Piece, 12 for Carton, etc.
  price_override?: number; // Optional specific price for this unit
  sync_status?: SyncStatus;
}

export interface Partner {
  id: string;
  org_id: string;
  name: string;
  type: PartnerType;
  phone?: string;
  tax_number?: string;
  is_active: boolean;
  balance?: number; // Computed
  sync_status?: SyncStatus;
}

// Alias for Partner when used as Customer
export type Customer = Partner;

export interface CashSession {
  id: string;
  org_id: string;
  user_id: string;
  status: CashSessionStatus;
  opening_amount: number;
  closing_amount?: number;
  variance?: number;
  opened_at: string;
  closed_at?: string;
  sync_status?: SyncStatus;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string; // Denormalized for UI
  qty: number;
  price: number;
  cost: number;
  discount: number; // New: Amount deducted
  tax_rate: number;
  tax_amount: number;
  total: number;
  unit_name?: string; // PIECE or CARTON
  note?: string; // New
}

export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  type: 'SALE' | 'PURCHASE' | 'SALE_RETURN' | 'PURCHASE_RETURN';
  partner_id?: string;
  warehouse_id: string;
  status: InvoiceStatus;
  payment_method: PaymentMethod;
  payment_details?: PaymentDetail[]; // New: For Split Payments
  date: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  paid_amount: number;
  created_by?: string;
  sync_status?: SyncStatus;
  // UI Helper
  items?: InvoiceItem[];
}

export interface StockMovement {
  id: string;
  org_id: string;
  warehouse_id: string;
  product_id: string;
  qty: number;
  type: string; // SALE, PURCHASE, IN, OUT
  ref_id?: string;
  created_at: string;
  sync_status?: SyncStatus;
}

export interface CashTransaction {
  id: string;
  org_id: string;
  session_id: string;
  amount: number;
  type: string;
  description?: string;
  ref_id?: string;
  created_at: string;
  sync_status?: SyncStatus;
}

export interface Expense {
  id: string;
  org_id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  created_by: string;
  sync_status?: SyncStatus;
}

// UI specific interfaces
export interface DashboardItem {
  id: string;
  title: string;
  route: AppRoute;
  iconName: string;
  color?: string;
}

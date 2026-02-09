
import { db } from './db/dexie';
import { generateId } from '../lib/utils';
import { Product, Partner, PartnerType, SyncStatus, Category, User, UserRole } from '../types';

export async function seedDatabase() {
  const userCount = await db.users.count();
  if (userCount === 0) {
    console.log('Seeding Admin User...');
    await db.users.add({
      id: generateId(),
      org_id: '1',
      username: 'admin',
      password_hash: '123456', // Default password
      full_name: 'Admin Maroc',
      role: UserRole.ADMIN,
      is_active: true,
      sync_status: SyncStatus.PENDING
    });
  }

  const productCount = await db.products.count();
  if (productCount > 0) return;

  console.log('Seeding Database for Morocco...');
  const orgId = '1';

  // 1. Categories
  const catDrinks = generateId();
  const catDairy = generateId();
  const catGroceries = generateId();
  const catBakery = generateId();
  const catProduce = generateId();
  const catCleaning = generateId();

  const categories: Category[] = [
    { id: catDrinks, org_id: orgId, name: 'مشروبات (Boissons)', sync_status: SyncStatus.PENDING },
    { id: catDairy, org_id: orgId, name: 'ألبان (Produits Laitiers)', sync_status: SyncStatus.PENDING },
    { id: catGroceries, org_id: orgId, name: 'مواد غذائية (Epicerie)', sync_status: SyncStatus.PENDING },
    { id: catBakery, org_id: orgId, name: 'مخبوزات (Boulangerie)', sync_status: SyncStatus.PENDING },
    { id: catProduce, org_id: orgId, name: 'خضار وفواكه (Fruits & Légumes)', sync_status: SyncStatus.PENDING },
    { id: catCleaning, org_id: orgId, name: 'تنظيف (Nettoyage)', sync_status: SyncStatus.PENDING },
  ];

  // 2. Products (Moroccan Context)
  const products: Product[] = [
    // Drinks
    { id: generateId(), org_id: orgId, category_id: catDrinks, name: 'Sidi Ali 1.5L', price: 6.0, cost: 4.5, stock: 500, barcodes: ['6111234567890'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 50, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catDrinks, name: 'Coca Cola 1L', price: 9.5, cost: 7.5, stock: 150, barcodes: ['5449000000996'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 20, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catDrinks, name: 'Raibi Jamila', price: 2.5, cost: 1.8, stock: 80, barcodes: ['611100010001'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 10, sync_status: SyncStatus.PENDING },

    // Dairy & Grocery
    { id: generateId(), org_id: orgId, category_id: catGroceries, name: 'Atay Sultan (الشاي)', price: 18.0, cost: 14.0, stock: 60, barcodes: ['611100020001'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 10, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catDairy, name: 'Fromage La Vache Qui Rit (8pcs)', price: 14.0, cost: 11.0, stock: 40, barcodes: ['611100020002'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 5, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catGroceries, name: 'Sucre Morceau (السكر)', price: 6.0, cost: 5.0, stock: 100, barcodes: ['611100020003'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 20, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catGroceries, name: 'Zit Tableur 1L', price: 19.0, cost: 17.0, stock: 50, barcodes: ['611100020004'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 10, sync_status: SyncStatus.PENDING },

    // Bakery
    { id: generateId(), org_id: orgId, category_id: catBakery, name: 'Baguette', price: 1.2, cost: 0.8, stock: 50, barcodes: ['2001'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 10, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catBakery, name: 'Pain Complet', price: 2.5, cost: 1.5, stock: 30, barcodes: ['2002'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 5, sync_status: SyncStatus.PENDING },

    // Cleaning
    { id: generateId(), org_id: orgId, category_id: catCleaning, name: 'Javel 1L', price: 4.5, cost: 3.0, stock: 40, barcodes: ['611100500001'], tax_rate: 0.20, is_active: true, is_stock_tracking: true, min_stock: 10, sync_status: SyncStatus.PENDING },
    
    // Scale Items (Produce) - Assuming Scale Barcode Prefix 29 or 27
    { id: generateId(), org_id: orgId, category_id: catProduce, name: 'Pomme de Terre (KG)', price: 6.0, cost: 3.0, stock: 200, barcodes: ['1001'], tax_rate: 0.0, is_active: true, is_stock_tracking: true, min_stock: 20, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, category_id: catProduce, name: 'Tomate (KG)', price: 5.0, cost: 2.5, stock: 150, barcodes: ['1002'], tax_rate: 0.0, is_active: true, is_stock_tracking: true, min_stock: 20, sync_status: SyncStatus.PENDING },
  ];

  const partners: Partner[] = [
    { id: generateId(), org_id: orgId, type: PartnerType.CUSTOMER, name: 'Client Comptoir (عام)', balance: 0, is_active: true, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, type: PartnerType.CUSTOMER, name: 'Café Atlas', phone: '0661123456', balance: 1500, is_active: true, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, type: PartnerType.SUPPLIER, name: 'Centrale Danone', phone: '0522000000', balance: 5000, is_active: true, sync_status: SyncStatus.PENDING },
    { id: generateId(), org_id: orgId, type: PartnerType.SUPPLIER, name: 'Dislog Group', phone: '0522111111', balance: 3200, is_active: true, sync_status: SyncStatus.PENDING },
  ];

  await (db as any).transaction('rw', db.products, db.product_barcodes, db.partners, db.categories, async () => {
    await db.categories.bulkAdd(categories);
    
    for (const p of products) {
      await db.products.add(p);
      if (p.barcodes && p.barcodes.length > 0) {
        for (const code of p.barcodes) {
          await db.product_barcodes.add({
            id: generateId(),
            org_id: orgId,
            product_id: p.id,
            barcode: code,
            is_primary: code === p.barcodes[0],
            sync_status: SyncStatus.PENDING
          });
        }
      }
    }
    await db.partners.bulkAdd(partners);
  });
  
  console.log('Moroccan Database seeded successfully.');
}

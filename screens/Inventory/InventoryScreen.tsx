
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import readXlsxFile from 'read-excel-file';
import { 
  Plus, 
  Search, 
  Tags, 
  ArrowRightLeft, 
  FileSpreadsheet, 
  ChevronLeft, 
  Package, 
  X,
  Save,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { db } from '../../data/db/dexie';
import { ProductList } from './ProductList';
import { ProductForm } from './ProductForm';
import { Product, Category, SyncStatus, ProductBarcode } from '../../types';
import { CategoryRepository, ProductRepository } from '../../data/repositories/dexieImpl';
import { generateId } from '../../lib/utils';
import { useSessionStore } from '../../store/useSessionStore';

type ViewState = 'MENU' | 'ADD_PRODUCT' | 'LIST_PRODUCTS' | 'ADD_CATEGORY' | 'EDIT_PRICES' | 'IMPORT';

export const InventoryScreen: React.FC = () => {
  const { orgId } = useSessionStore();
  const [currentView, setCurrentView] = useState<ViewState>('MENU');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  // --- Sub-Component: Menu Item ---
  const MenuItem = ({ title, icon: Icon, onClick, color }: { title: string, icon: any, onClick: () => void, color: string }) => (
    <button 
      onClick={onClick}
      className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-all active:scale-[0.99] mb-3"
    >
      <div className="flex items-center gap-3">
        <span className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </span>
        <span className="text-gray-800 font-bold text-lg">{title}</span>
      </div>
      <ChevronLeft className="text-gray-300" />
    </button>
  );

  // --- Sub-Component: Add Category Form ---
  const CategoryForm = () => {
    const [name, setName] = useState('');
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      await CategoryRepository.create({
        id: generateId(),
        org_id: orgId,
        name: name,
        sync_status: SyncStatus.PENDING
      });
      alert('تم إضافة التصنيف بنجاح / Catégorie ajoutée');
      setName('');
    };

    const categories = useLiveQuery(() => db.categories.where('org_id').equals(orgId).toArray(), [orgId]);

    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-lg mx-auto mt-10">
        <h3 className="font-bold text-xl mb-4 text-center">إضافة تصنيف جديد (Catégorie)</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Nom (ex: Boissons)" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">حفظ / Enregistrer</button>
        </form>

        <div className="mt-8">
          <h4 className="font-bold text-gray-700 mb-2">التصنيفات الحالية</h4>
          <div className="flex flex-wrap gap-2">
            {categories?.map(c => (
              <span key={c.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200">{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- Sub-Component: Bulk Price Editor ---
  const BulkPriceEditor = () => {
    const products = useLiveQuery(() => db.products.where('org_id').equals(orgId).toArray(), [orgId]);
    const [edits, setEdits] = useState<Record<string, number>>({});

    const handlePriceChange = (id: string, newPrice: number) => {
      setEdits(prev => ({ ...prev, [id]: newPrice }));
    };

    const saveChanges = async () => {
      let count = 0;
      for (const [id, price] of Object.entries(edits)) {
        await db.products.update(id, { price: price, sync_status: SyncStatus.PENDING });
        count++;
      }
      setEdits({});
      alert(`تم تحديث ${count} منتجات بنجاح`);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold">تعديل الأسعار السريع</h3>
          <button 
            onClick={saveChanges}
            disabled={Object.keys(edits).length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            حفظ / Sauvegarder
          </button>
        </div>
        <div className="overflow-auto p-4">
          <table className="w-full text-right">
            <thead>
              <tr className="text-gray-500 text-sm border-b">
                <th className="pb-2">المنتج (Produit)</th>
                <th className="pb-2">السعر الحالي (د.م)</th>
                <th className="pb-2">السعر الجديد (د.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products?.map(p => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="py-3 text-gray-500">{p.price.toFixed(2)}</td>
                  <td className="py-3">
                    <input 
                      type="number" 
                      className={`w-24 p-2 border rounded-lg text-center font-bold ${edits[p.id] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
                      defaultValue={p.price}
                      onChange={(e) => handlePriceChange(p.id, parseFloat(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- Sub-Component: Import View ---
  const ImportView = () => {
    const [importing, setImporting] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      setLog(['بدء قراءة الملف / Lecture du fichier...']);

      try {
        const rows = await readXlsxFile(file);
        
        // Find indexes with support for Arabic, French, and English
        const header = rows[0].map((h: any) => h?.toString().toLowerCase().trim());
        
        const nameIdx = header.findIndex(h => h.includes('name') || h.includes('اسم') || h.includes('nom') || h.includes('désignation'));
        const priceIdx = header.findIndex(h => h.includes('price') || h.includes('سعر') || h.includes('prix'));
        const costIdx = header.findIndex(h => h.includes('cost') || h.includes('تكلفة') || h.includes('coût') || h.includes('achat'));
        const barcodeIdx = header.findIndex(h => h.includes('barcode') || h.includes('باركود') || h.includes('code') || h.includes('barre'));
        const stockIdx = header.findIndex(h => h.includes('stock') || h.includes('كمية') || h.includes('quantité'));
        
        if (nameIdx === -1 || priceIdx === -1) {
          throw new Error("Columns missing: Name (Nom), Price (Prix) are required.");
        }

        let addedCount = 0;
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const name = row[nameIdx]?.toString();
          const price = parseFloat(row[priceIdx]?.toString() || '0');
          const cost = costIdx > -1 ? parseFloat(row[costIdx]?.toString() || '0') : 0;
          const barcode = barcodeIdx > -1 ? row[barcodeIdx]?.toString() : '';
          const stock = stockIdx > -1 ? parseFloat(row[stockIdx]?.toString() || '0') : 0;

          if (name && price >= 0) {
            const productId = generateId();
            
            const product: Product = {
              id: productId,
              org_id: orgId,
              name: name,
              price: price,
              cost: cost, 
              stock: stock,
              min_stock: 5,
              tax_rate: 0.20, // Moroccan TVA default
              is_active: true,
              is_stock_tracking: true,
              sync_status: SyncStatus.PENDING
            };

            const barcodes: ProductBarcode[] = [];
            if (barcode) {
              barcodes.push({
                id: generateId(),
                org_id: orgId,
                product_id: productId,
                barcode: barcode,
                is_primary: true,
                unit_type: 'قطعة',
                factor: 1,
                sync_status: SyncStatus.PENDING
              });
            }

            await ProductRepository.create(product, barcodes);
            addedCount++;
          }
        }
        
        setLog(prev => [...prev, `Succès! ${addedCount} produits importés.`]);

      } catch (error: any) {
        setLog(prev => [...prev, `Erreur: ${error.message}`]);
      } finally {
        setImporting(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <FileSpreadsheet size={40} />
        </div>
        <h3 className="text-xl font-bold mb-2">استيراد المنتجات (Excel)</h3>
        <p className="text-gray-500 max-w-md mb-8">
          قم برفع ملف Excel يحتوي على الأعمدة التالية (بالفرنسية أو العربية): <br/>
          (Nom, Prix, CodeBarre, Stock)
        </p>
        
        {importing ? (
           <div className="flex items-center gap-2 text-blue-600 font-bold">
             <Loader2 className="animate-spin" /> Traitement en cours...
           </div>
        ) : (
          <label className="cursor-pointer bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">
            اختر ملف Excel
            <input type="file" className="hidden" accept=".xlsx" onChange={handleFileUpload} />
          </label>
        )}

        <div className="mt-6 w-full max-w-md bg-gray-50 p-4 rounded-lg text-right text-sm h-32 overflow-y-auto" dir="ltr">
          {log.map((l, i) => <div key={i} className="border-b border-gray-200 py-1 last:border-0">{l}</div>)}
        </div>
      </div>
    );
  };

  // --- Main Render ---

  // Handle Back Navigation inside Module
  if (currentView !== 'MENU') {
    return (
      <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
        <button 
          onClick={() => {
            setCurrentView('MENU');
            setSelectedProduct(undefined);
          }}
          className="self-start mb-4 flex items-center gap-1 text-gray-500 hover:text-blue-600 font-bold"
        >
          <ArrowRight size={20} />
          العودة للقائمة
        </button>

        <div className="flex-1">
          {currentView === 'ADD_PRODUCT' && (
            <div className="max-w-2xl mx-auto h-full">
              <ProductForm 
                product={undefined} 
                onClose={() => setCurrentView('MENU')} 
                onSave={() => {
                  alert('تمت الإضافة');
                  setCurrentView('MENU');
                }} 
              />
            </div>
          )}

          {currentView === 'LIST_PRODUCTS' && (
            <ProductList 
              onAdd={() => setCurrentView('ADD_PRODUCT')} 
              onEdit={(p) => {
                setSelectedProduct(p);
                setCurrentView('ADD_PRODUCT'); // Use existing form for edit
              }} 
            />
          )}
          
          {/* Quick fix: If we are in ADD_PRODUCT but have a selectedProduct, we render ProductForm in edit mode */}
          {currentView === 'ADD_PRODUCT' && selectedProduct && (
             <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-2xl h-[90vh]">
                   <ProductForm 
                      product={selectedProduct} 
                      onClose={() => {
                        setSelectedProduct(undefined);
                        setCurrentView('LIST_PRODUCTS'); // Go back to list after edit cancel
                      }} 
                      onSave={() => {
                        setSelectedProduct(undefined);
                        setCurrentView('LIST_PRODUCTS'); // Go back to list after edit save
                      }} 
                   />
                </div>
             </div>
          )}

          {currentView === 'ADD_CATEGORY' && <CategoryForm />}
          {currentView === 'EDIT_PRICES' && <BulkPriceEditor />}
          {currentView === 'IMPORT' && <ImportView />}
        </div>
      </div>
    );
  }

  // --- Menu View (Dashboard Style) ---
  return (
    <div className="p-6 max-w-3xl mx-auto min-h-[80vh] flex flex-col items-center pt-10">
      
      <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Package size={48} className="text-amber-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-10">المخزون (Stock)</h2>

      <div className="w-full space-y-4">
        <MenuItem 
          title="اضافة منتج جديد" 
          icon={Plus} 
          color="text-green-600 bg-green-600" 
          onClick={() => setCurrentView('ADD_PRODUCT')} 
        />
        
        <MenuItem 
          title="عرض المنتجات" 
          icon={Search} 
          color="text-gray-600 bg-gray-600" 
          onClick={() => setCurrentView('LIST_PRODUCTS')} 
        />

        <MenuItem 
          title="اضافة تصنيف جديد" 
          icon={Tags} 
          color="text-green-600 bg-green-600" 
          onClick={() => setCurrentView('ADD_CATEGORY')} 
        />

        <MenuItem 
          title="تعديل اسعار المنتجات" 
          icon={ArrowRightLeft} 
          color="text-gray-600 bg-gray-600" 
          onClick={() => setCurrentView('EDIT_PRICES')} 
        />

        <MenuItem 
          title="استيراد بيانات المنتجات (Excel)" 
          icon={FileSpreadsheet} 
          color="text-green-600 bg-green-600" 
          onClick={() => setCurrentView('IMPORT')} 
        />
      </div>
    </div>
  );
};

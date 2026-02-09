
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, X, ScanBarcode, Plus, Trash2, Box } from 'lucide-react';
import { Product, ProductBarcode, SyncStatus } from '../../types';
import { db } from '../../data/db/dexie';
import { ProductRepository } from '../../data/repositories/dexieImpl';
import { generateId } from '../../lib/utils';
import { useSessionStore } from '../../store/useSessionStore';

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
  onSave: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSave }) => {
  const { orgId } = useSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = useLiveQuery(
    () => db.categories.where('org_id').equals(orgId).toArray(),
    [orgId]
  );

  const existingBarcodes = useLiveQuery(
    async () => product ? await db.product_barcodes.where('product_id').equals(product.id).toArray() : [],
    [product]
  );

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '5',
    tax_rate: '0.20' // Default to 20% (Morocco)
  });

  const [barcodeList, setBarcodeList] = useState<{barcode: string, unit: string, factor: string, priceOverride: string}[]>([
    { barcode: '', unit: 'قطعة', factor: '1', priceOverride: '' }
  ]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category_id: product.category_id || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock?.toString() || '0',
        min_stock: product.min_stock.toString(),
        tax_rate: product.tax_rate.toString()
      });
    }
  }, [product]);

  useEffect(() => {
    if (existingBarcodes && existingBarcodes.length > 0) {
      setBarcodeList(existingBarcodes.map(b => ({
        barcode: b.barcode,
        unit: b.unit_type || 'قطعة',
        factor: b.factor?.toString() || '1',
        priceOverride: b.price_override?.toString() || ''
      })));
    }
  }, [existingBarcodes]);

  const addBarcodeRow = () => {
    setBarcodeList([...barcodeList, { barcode: '', unit: 'كرتون', factor: '12', priceOverride: '' }]);
  };

  const removeBarcodeRow = (index: number) => {
    if (barcodeList.length > 1) {
      setBarcodeList(barcodeList.filter((_, i) => i !== index));
    }
  };

  const updateBarcodeRow = (index: number, field: string, value: string) => {
    const newList = [...barcodeList];
    newList[index] = { ...newList[index], [field]: value };
    setBarcodeList(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const price = parseFloat(formData.price);
      const cost = parseFloat(formData.cost);
      
      if (isNaN(price) || price < 0) throw new Error('سعر البيع غير صحيح');
      
      const productData: Product = {
        id: product?.id || generateId(),
        org_id: orgId,
        category_id: formData.category_id || undefined,
        name: formData.name,
        price: price,
        cost: isNaN(cost) ? 0 : cost,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        is_active: true,
        is_stock_tracking: true,
        stock: parseInt(formData.stock) || 0,
        barcodes: barcodeList.map(b => b.barcode).filter(b => b), // Legacy support
        sync_status: SyncStatus.PENDING
      };

      // Prepare Barcode Objects
      const barcodeObjects: ProductBarcode[] = barcodeList
        .filter(b => b.barcode.trim() !== '')
        .map((b, idx) => ({
          id: generateId(),
          org_id: orgId,
          product_id: productData.id,
          barcode: b.barcode,
          is_primary: idx === 0,
          unit_type: b.unit,
          factor: parseFloat(b.factor) || 1,
          price_override: b.priceOverride ? parseFloat(b.priceOverride) : undefined,
          sync_status: SyncStatus.PENDING
        }));

      if (product) {
        // Edit mode
        await ProductRepository.update(productData);
        // Clear old barcodes and add new ones (simpler than syncing)
        // In real app, be careful not to break history if referencing barcode IDs
        await db.product_barcodes.where('product_id').equals(product.id).delete();
        await db.product_barcodes.bulkAdd(barcodeObjects);
      } else {
        // Create mode
        await ProductRepository.create(productData, barcodeObjects);
      }
      
      onSave();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ. تأكد من صحة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-[90vh] flex flex-col">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-lg text-gray-800">
          {product ? 'تعديل منتج' : 'إضافة منتج جديد'}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
          <input
            required
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Sidi Ali 1.5L"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            value={formData.category_id}
            onChange={e => setFormData({...formData, category_id: e.target.value})}
          >
            <option value="">-- بدون تصنيف --</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سعر بيع (القطعة)</label>
            <div className="relative">
              <input
                required
                type="number"
                step="0.01"
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
              <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">DH</span>
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
              />
               <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">DH</span>
            </div>
          </div>
        </div>

        {/* Barcodes & Units Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Box size={16} />
            الباركود والوحدات (كرتون / حبة)
          </label>
          <div className="space-y-3">
            {barcodeList.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                   <label className="text-xs text-gray-500 mb-1 block">الباركود</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        className="w-full p-2 pl-8 border border-gray-300 rounded-lg text-sm"
                        placeholder="Scan or type"
                        value={row.barcode}
                        onChange={(e) => updateBarcodeRow(idx, 'barcode', e.target.value)}
                      />
                      <ScanBarcode size={14} className="absolute left-2 top-3 text-gray-400" />
                   </div>
                </div>
                <div className="w-20">
                   <label className="text-xs text-gray-500 mb-1 block">الوحدة</label>
                   <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      value={row.unit}
                      onChange={(e) => updateBarcodeRow(idx, 'unit', e.target.value)}
                   />
                </div>
                <div className="w-16">
                   <label className="text-xs text-gray-500 mb-1 block">العدد</label>
                   <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center"
                      value={row.factor}
                      onChange={(e) => updateBarcodeRow(idx, 'factor', e.target.value)}
                      title="كم حبة داخل هذه الوحدة؟"
                   />
                </div>
                <div className="w-24">
                   <label className="text-xs text-gray-500 mb-1 block">سعر خاص</label>
                   <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="DH"
                      value={row.priceOverride}
                      onChange={(e) => updateBarcodeRow(idx, 'priceOverride', e.target.value)}
                   />
                </div>
                {barcodeList.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeBarcodeRow(idx)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg mb-0.5"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addBarcodeRow}
              className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline mt-2"
            >
              <Plus size={14} /> إضافة وحدة/باركود آخر (مثل: كرتون)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الحالي (حبة)</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.stock}
              onChange={e => setFormData({...formData, stock: e.target.value})}
              disabled={!!product} 
            />
          </div>

          {/* Min Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">حد الطلب</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.min_stock}
              onChange={e => setFormData({...formData, min_stock: e.target.value})}
            />
          </div>
        </div>

        {/* Tax Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الضريبة (TVA)</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.tax_rate}
            onChange={e => setFormData({...formData, tax_rate: e.target.value})}
          >
            <option value="0">0% (معفى)</option>
            <option value="0.20">20% (Standard TVA)</option>
            <option value="0.14">14%</option>
            <option value="0.10">10%</option>
            <option value="0.07">7%</option>
          </select>
        </div>

      </form>

      <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-white"
          >
            إلغاء
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </button>
      </div>
    </div>
  );
};

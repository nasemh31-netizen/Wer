
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Plus, Edit, Package } from 'lucide-react';
import { db } from '../../data/db/dexie';
import { Product } from '../../types';
import { useSessionStore } from '../../store/useSessionStore';

interface ProductListProps {
  onEdit: (product: Product) => void;
  onAdd: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onEdit, onAdd }) => {
  const { orgId } = useSessionStore();
  const [searchTerm, setSearchTerm] = useState('');

  const products = useLiveQuery(
    () => db.products.where('org_id').equals(orgId).toArray()
  , [orgId]);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcodes && p.barcodes.some(b => b.includes(searchTerm)))
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Search & Add Bar */}
      <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex gap-2">
           <div className="relative flex-1">
             <input
               type="text"
               placeholder="بحث (اسم/باركود)..."
               className="w-full p-3 pr-10 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
           </div>
           <button 
             onClick={onAdd}
             className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
           >
             <Plus size={24} />
           </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {filteredProducts?.length === 0 ? (
           <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
             <Package size={48} className="mb-2 opacity-20" />
             <p>لا توجد منتجات مطابقة</p>
           </div>
        ) : (
          filteredProducts?.map(product => (
            <div 
               key={product.id} 
               onClick={() => onEdit(product)}
               className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-base">{product.name}</h3>
                <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg text-sm">
                  {product.price.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex gap-3">
                   <div className="flex items-center gap-1">
                     <span className={`w-2 h-2 rounded-full ${(product.stock || 0) <= (product.min_stock || 0) ? 'bg-red-500' : 'bg-green-500'}`}></span>
                     <span>مخزون: <strong>{product.stock || 0}</strong></span>
                   </div>
                   {product.barcodes?.[0] && (
                     <span className="font-mono text-xs bg-gray-100 px-1 rounded">{product.barcodes[0]}</span>
                   )}
                </div>
                <Edit size={16} className="text-gray-300" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

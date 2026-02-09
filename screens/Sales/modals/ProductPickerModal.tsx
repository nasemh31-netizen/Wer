
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Product, ProductBarcode } from '../../../types';

interface ProductPickerModalProps {
  products: Product[] | undefined;
  productBarcodes: ProductBarcode[] | undefined;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({ 
  products, 
  productBarcodes, 
  onClose, 
  onSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    const lowerTerm = searchTerm.toLowerCase();
    const matchingProductIds = productBarcodes
      ?.filter(pb => pb.barcode.includes(lowerTerm))
      .map(pb => pb.product_id) || [];
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerTerm) || matchingProductIds.includes(p.id)
    );
  }, [products, productBarcodes, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">اختيار منتج (Grid)</h3>
          <button onClick={onClose} className="p-2 bg-gray-200 rounded-full"><X /></button>
        </div>
        <div className="p-4 border-b bg-white">
           <input 
             type="text" 
             placeholder="بحث سريع..." 
             className="w-full p-3 border rounded-lg text-lg text-right outline-none" 
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
             autoFocus 
           />
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => onSelect(p)} 
                  className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center h-32 hover:border-blue-500 relative"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-2">
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-center line-clamp-2 h-8 leading-tight">{p.name}</span>
                  <span className="text-blue-600 font-bold mt-1 text-sm">{p.price.toFixed(2)}</span>
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

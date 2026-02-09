
import React, { useEffect, useRef } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useSalesStore } from '../../../store/useSalesStore';

export const SalesTable: React.FC = () => {
  const { getCurrentCart, removeFromCart, updateItemQty } = useSalesStore();
  const { items } = getCurrentCart();
  const lastItemRef = useRef<HTMLDivElement>(null);

  // Auto scroll to last added item
  useEffect(() => {
    if (lastItemRef.current) {
      lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <p className="font-bold text-xl text-gray-600">السلة فارغة</p>
        <p className="text-sm">ابدأ بمسح المنتجات أو البحث عنها</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-32 pt-2 px-3 space-y-3">
      {items.map((item) => {
        const lineTotalRaw = item.price * item.qty;
        const discountAmount = item.discountType === 'FIXED' ? item.discount * item.qty : lineTotalRaw * (item.discount/100);
        const lineTotal = (lineTotalRaw - discountAmount) * (1 + item.taxRate);

        return (
          <div 
            key={item.rowId}
            ref={item.isLastAdded ? lastItemRef : null}
            className={`bg-white rounded-[1.2rem] p-4 shadow-sm border border-transparent transition-all relative overflow-hidden group
              ${item.isLastAdded ? 'ring-2 ring-blue-500/50 shadow-blue-100' : ''}`}
          >
            <div className="flex justify-between items-start gap-3">
              
              {/* Product Info */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-base leading-snug mb-1">{item.product.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900">{item.price.toFixed(2)}</span>
                  {item.discount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                      خصم {item.discountType === 'PERCENT' ? `${item.discount}%` : item.discount}
                    </span>
                  )}
                </div>
              </div>

              {/* Total & Remove */}
              <div className="text-right">
                <div className="font-black text-lg text-gray-900 leading-none mb-1">
                  {lineTotal.toFixed(2)}
                </div>
                <button 
                  onClick={() => removeFromCart(item.rowId)}
                  className="text-xs text-red-400 font-medium hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>

            {/* Stepper (iOS Style) */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 border-dashed">
               <span className="text-xs text-gray-400 font-medium">الكمية</span>
               
               <div className="flex items-center bg-[#f2f2f7] rounded-full p-1 h-10 w-36 shadow-inner">
                  <button 
                    onClick={() => updateItemQty(item.rowId, item.qty - 1)}
                    className="w-10 h-full bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-all disabled:opacity-50"
                    disabled={item.qty <= 1}
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  
                  <div className="flex-1 text-center font-black text-lg text-gray-800 leading-none pt-1">
                    {item.qty}
                  </div>
                  
                  <button 
                    onClick={() => updateItemQty(item.rowId, item.qty + 1)}
                    className="w-10 h-full bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 active:scale-90 transition-all"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

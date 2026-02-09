
import React from 'react';
import { ChevronUp, CreditCard } from 'lucide-react';
import { useSalesStore } from '../../../store/useSalesStore';

interface SalesFooterProps {
  onPaymentClick: () => void;
  isCartEmpty: boolean;
}

export const SalesFooter: React.FC<SalesFooterProps> = ({ 
  onPaymentClick,
  isCartEmpty 
}) => {
  const { getTotals } = useSalesStore();
  const totals = getTotals();

  if (isCartEmpty) return null;

  return (
    <div className="absolute bottom-6 left-4 right-4 z-40">
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 pr-6 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Total Text */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-0.5">المجموع الكلي</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900 tracking-tight">{totals.grandTotal.toFixed(2)}</span>
            <span className="text-sm font-bold text-gray-400">DH</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onPaymentClick}
          className="bg-blue-600 text-white h-14 px-8 rounded-[1.6rem] font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 hover:bg-blue-700 transition-all flex items-center gap-2 group"
        >
          <span>دفع</span>
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
             <CreditCard size={14} />
          </div>
        </button>
      </div>

      {/* Item Count Badge (Floating above) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
        {totals.itemCount} منتج
      </div>
    </div>
  );
};

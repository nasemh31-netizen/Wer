
import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface QuickProductSheetProps {
  searchTerm: string;
  onClose: () => void;
  onSave: (name: string, price: number) => void;
}

export const QuickProductSheet: React.FC<QuickProductSheetProps> = ({ searchTerm, onClose, onSave }) => {
  const [name, setName] = useState(searchTerm);
  const [price, setPrice] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus price since name is pre-filled
    setTimeout(() => {
      priceInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!name || isNaN(parsedPrice)) return;
    onSave(name, parsedPrice);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2rem] shadow-2xl p-6 animate-in slide-in-from-bottom-full duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800">إضافة منتج سريع</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2">اسم المنتج</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 font-bold text-lg outline-none"
              placeholder="مثال: سماعة ايفون"
            />
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-500 mb-2">سعر البيع</label>
             <div className="relative">
               <input 
                 ref={priceInputRef}
                 type="number" 
                 step="0.01"
                 value={price}
                 onChange={e => setPrice(e.target.value)}
                 className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 font-black text-2xl outline-none"
                 placeholder="0.00"
               />
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">DH</span>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={!name || !price}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:scale-100 mt-4 flex items-center justify-center gap-2"
          >
            <Check size={20} />
            حفظ وإضافة للسلة
          </button>
        </form>
      </div>
    </>
  );
};

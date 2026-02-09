
import React, { useState } from 'react';
import { X, Percent, DollarSign } from 'lucide-react';

interface GlobalDiscountModalProps {
  onClose: () => void;
  onApply: (value: number, type: 'FIXED' | 'PERCENT') => void;
  currentValue: number;
  currentType: 'FIXED' | 'PERCENT';
}

export const GlobalDiscountModal: React.FC<GlobalDiscountModalProps> = ({ onClose, onApply, currentValue, currentType }) => {
  const [value, setValue] = useState(currentValue.toString());
  const [type, setType] = useState<'FIXED' | 'PERCENT'>(currentType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(parseFloat(value) || 0, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-3 bg-gray-100 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800">خصم إجمالي على الفاتورة</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType('PERCENT')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 border ${type === 'PERCENT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              <Percent size={18} /> نسبة مئوية
            </button>
            <button
              type="button"
              onClick={() => setType('FIXED')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 border ${type === 'FIXED' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              <DollarSign size={18} /> مبلغ ثابت
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">قيمة الخصم</label>
            <input 
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg text-xl font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
              value={value}
              onChange={e => setValue(e.target.value)}
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
          >
            تطبيق الخصم
          </button>
        </form>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { X, User, Phone, Save } from 'lucide-react';

interface AddCustomerSheetProps {
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
}

export const AddCustomerSheet: React.FC<AddCustomerSheetProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, phone);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[2rem] shadow-2xl p-6 animate-in slide-in-from-bottom-full duration-300">
        
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-gray-800">عميل جديد</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 mr-1">الاسم الكامل</label>
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 font-bold text-lg outline-none transition-colors placeholder-gray-300"
                placeholder="اسم العميل"
                autoFocus
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-500 mb-2 mr-1">رقم الهاتف (اختياري)</label>
             <div className="relative">
               <input 
                 type="tel" 
                 value={phone}
                 onChange={e => setPhone(e.target.value)}
                 className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 font-bold text-lg outline-none transition-colors placeholder-gray-300 text-right dir-rtl"
                 placeholder="06xxxxxxxx"
               />
               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={!name.trim()}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:scale-100 mt-4 flex items-center justify-center gap-3"
          >
            <Save size={24} />
            حفظ العميل
          </button>
        </form>
      </div>
    </>
  );
};

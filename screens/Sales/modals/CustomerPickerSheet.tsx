
import React, { useState } from 'react';
import { Search, Plus, User, X, Phone, Check } from 'lucide-react';
import { Customer } from '../../../types';

interface CustomerPickerSheetProps {
  customers: Customer[] | undefined;
  currentCustomer: Customer | null;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
  onAddNew: () => void;
}

export const CustomerPickerSheet: React.FC<CustomerPickerSheetProps> = ({
  customers,
  currentCustomer,
  onClose,
  onSelect,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  ) || [];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#f2f2f7] rounded-t-[2rem] shadow-2xl h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
        
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

        {/* Header */}
        <div className="px-6 pb-4 flex justify-between items-center">
          <h3 className="text-2xl font-black text-gray-900">اختيار عميل</h3>
          <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
             <Search className="absolute right-3 top-3.5 text-gray-400" size={20} />
             <input 
               type="text"
               placeholder="بحث بالاسم أو الهاتف..."
               className="w-full bg-white p-3 pr-10 rounded-2xl text-lg font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               autoFocus
             />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-8">
          
          {/* Add New Option */}
          <button 
            onClick={onAddNew}
            className="w-full bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 active:scale-98 transition-transform group border border-transparent hover:border-blue-200"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <div className="flex-1 text-right">
              <h4 className="font-bold text-lg text-blue-600">إضافة عميل جديد</h4>
              <p className="text-sm text-gray-400">تسجيل سريع (الاسم + الهاتف)</p>
            </div>
          </button>

          {/* Guest Option (Clear) */}
          {currentCustomer && (
             <button 
              onClick={() => onSelect(null)}
              className="w-full bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 active:scale-98 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                <User size={24} />
              </div>
              <div className="flex-1 text-right">
                <h4 className="font-bold text-gray-800">عميل عام (Guest)</h4>
                <p className="text-sm text-gray-400">إلغاء تحديد العميل الحالي</p>
              </div>
              {currentCustomer === null && <Check className="text-blue-600" />}
            </button>
          )}

          <div className="text-xs font-bold text-gray-400 px-2 mt-2">العملاء المسجلين ({filtered.length})</div>

          {/* Filtered List */}
          {filtered.map(c => (
            <button 
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full p-4 rounded-2xl shadow-sm flex items-center gap-4 active:scale-98 transition-transform border-2
                ${currentCustomer?.id === c.id ? 'bg-blue-50 border-blue-500 shadow-blue-100' : 'bg-white border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors
                 ${currentCustomer?.id === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 text-right">
                <h4 className="font-bold text-gray-900 text-lg">{c.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                   <Phone size={14} className="opacity-70" />
                   <span dir="ltr">{c.phone || '---'}</span>
                </div>
              </div>
              {currentCustomer?.id === c.id && <Check className="text-blue-600" strokeWidth={3} />}
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <User size={48} className="mx-auto mb-2 opacity-20" />
              <p>لا يوجد عميل بهذا الاسم</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};


import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, Calendar, Tag, Wallet, Save, X, FileText, AlertTriangle } from 'lucide-react';
import { db } from '../../data/db/dexie';
import { ExpenseRepository, CashRepository } from '../../data/repositories/dexieImpl';
import { Expense, SyncStatus, CashSessionStatus } from '../../types';
import { useSessionStore } from '../../store/useSessionStore';
import { generateId } from '../../lib/utils';

export const ExpensesScreen: React.FC = () => {
  const { orgId, userId } = useSessionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Active Session Check
  const activeSession = useLiveQuery(
    () => db.cash_sessions.where({ status: CashSessionStatus.OPEN }).first()
  , []);

  const expenses = useLiveQuery(
    () => db.expenses.where('org_id').equals(orgId).reverse().sortBy('date')
  , [orgId]);

  const filteredExpenses = expenses?.filter(e => 
    e.category.includes(searchTerm) || 
    (e.description && e.description.includes(searchTerm))
  );

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
  });

  const categories = [
    'إيجار', 'كهرباء', 'مياه', 'رواتب', 'نثريات', 'صيانة', 'تسويق', 'ضيافة', 'أخرى'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) {
      alert('يجب فتح الصندوق (بدء الوردية) أولاً لتسجيل مصروف نقدي.');
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) return;

      const expense: Expense = {
        id: generateId(),
        org_id: orgId,
        date: new Date().toISOString(),
        amount: amount,
        category: formData.category || 'أخرى',
        description: formData.description,
        created_by: userId || 'unknown',
        sync_status: SyncStatus.PENDING
      };

      await ExpenseRepository.create(expense);
      setIsModalOpen(false);
      setFormData({ amount: '', category: '', description: '' });
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ المصروف');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      
      {/* Header / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 mb-1">إجمالي مصروفات اليوم</p>
            <h3 className="text-2xl font-bold text-orange-600">
              {expenses?.filter(e => new Date(e.date).toDateString() === new Date().toDateString())
                .reduce((sum, e) => sum + e.amount, 0).toFixed(2)} DH
            </h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="بحث في المصروفات..."
              className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-700 flex items-center gap-2 w-full md:w-auto justify-center transition-colors"
          >
            <Plus size={20} />
            تسجيل مصروف
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 p-2">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm font-semibold sticky top-0">
              <tr>
                <th className="p-4 rounded-tr-lg">التاريخ</th>
                <th className="p-4">الفئة</th>
                <th className="p-4">الوصف</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4 rounded-tl-lg">بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                filteredExpenses?.map(expense => (
                  <tr key={expense.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(expense.date).toLocaleString('ar-MA')}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800">{expense.description || '-'}</td>
                    <td className="p-4 font-bold text-red-600">-{expense.amount.toFixed(2)}</td>
                    <td className="p-4 text-xs text-gray-500">{expense.created_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-orange-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wallet size={20} />
                تسجيل مصروف جديد
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {!activeSession && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p>تنبيه: لا توجد وردية مفتوحة حالياً. يرجى فتح الصندوق أولاً لتتمكن من تسجيل المصروفات.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ المصروف</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-lg"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    disabled={!activeSession}
                  />
                  <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-bold">DH</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">فئة المصروف</label>
                <div className="relative">
                  <select
                    required
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    disabled={!activeSession}
                  >
                    <option value="" disabled>اختر الفئة...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Tag className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف / ملاحظات</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                  placeholder="تفاصيل إضافية..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  disabled={!activeSession}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!activeSession}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

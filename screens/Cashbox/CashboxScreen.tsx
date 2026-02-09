
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Vault, Lock, Unlock, ArrowUpCircle, ArrowDownCircle, History, AlertCircle } from 'lucide-react';
import { CashSession, CashSessionStatus, CashTransaction, SyncStatus } from '../../types';
import { db } from '../../data/db/dexie';
import { CashRepository } from '../../data/repositories/dexieImpl';
import { generateId } from '../../lib/utils';
import { useSessionStore } from '../../store/useSessionStore';

export const CashboxScreen: React.FC = () => {
  const { orgId, userId } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // Get active session
  const activeSession = useLiveQuery(
    () => db.cash_sessions.where({ status: CashSessionStatus.OPEN }).first()
  , []);

  // Get transactions for active session
  const transactions = useLiveQuery(
    async () => {
      if (!activeSession) return [];
      return await db.cash_transactions.where('session_id').equals(activeSession.id).reverse().toArray();
    },
    [activeSession]
  );

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!transactions) return { in: 0, out: 0, balance: 0 };
    const totalIn = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    return {
      in: totalIn,
      out: totalOut,
      balance: totalIn - totalOut
    };
  }, [transactions]);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amount = parseFloat(openingAmount);
      if (isNaN(amount)) throw new Error('المبلغ غير صحيح');

      const newSession: CashSession = {
        id: generateId(),
        org_id: orgId,
        user_id: userId || 'unknown',
        status: CashSessionStatus.OPEN,
        opening_amount: amount,
        opened_at: new Date().toISOString(),
        sync_status: SyncStatus.PENDING
      };

      await CashRepository.openSession(newSession);
      setOpeningAmount('');
    } catch (error) {
      console.error(error);
      alert('خطأ في فتح الصندوق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    setIsLoading(true);
    try {
      const actualCash = parseFloat(closingAmount);
      if (isNaN(actualCash)) {
        alert('الرجاء إدخال المبلغ الفعلي الموجود في الدرج');
        setIsLoading(false);
        return;
      }

      // Expected balance = Total IN - Total OUT (Includes Opening Balance transaction)
      const expectedBalance = totals.balance;
      const variance = actualCash - expectedBalance;

      await CashRepository.closeSession(activeSession.id, {
        closing_amount: actualCash,
        variance: variance,
        closed_at: new Date().toISOString()
      });

      setIsClosingModalOpen(false);
      setClosingAmount('');
    } catch (error) {
      console.error(error);
      alert('خطأ في إغلاق الصندوق');
    } finally {
      setIsLoading(false);
    }
  };

  if (activeSession === undefined) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  // --- VIEW: NO OPEN SESSION ---
  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">الصندوق مغلق</h2>
          <p className="text-gray-500 mb-8">يجب فتح جلسة جديدة للبدء في عمليات البيع</p>
          
          <form onSubmit={handleOpenSession} className="space-y-4">
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الافتتاحي (العهدة)</label>
              <input 
                type="number" 
                step="0.01"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              <Unlock size={20} />
              فتح الصندوق
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW: ACTIVE SESSION ---
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">الرصيد الافتتاحي</p>
              <h3 className="text-2xl font-bold text-gray-800">{activeSession.opening_amount.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Vault size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي المقبوضات</p>
              <h3 className="text-2xl font-bold text-green-700">{totals.in.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><ArrowDownCircle size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">إجمالي المصروفات</p>
              <h3 className="text-2xl font-bold text-red-700">{totals.out.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600"><ArrowUpCircle size={24} /></div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400 mb-1">الرصيد الحالي المتوقع</p>
              <h3 className="text-2xl font-bold text-yellow-400">{totals.balance.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg text-yellow-400"><Lock size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <History size={20} />
              حركات الصندوق الأخيرة
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {transactions?.length === 0 ? (
              <div className="p-8 text-center text-gray-400">لا توجد حركات مسجلة</div>
            ) : (
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">الوقت</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">الوصف</th>
                    <th className="p-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions?.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500">
                        {new Date(tx.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {tx.type === 'IN' ? 'قبض' : 'صرف'}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{tx.description}</td>
                      <td className={`p-3 font-bold ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
           {/* Add Expense Shortcut - Placeholder for now */}
           {/* <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4">إجراءات سريعة</h3>
             <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-400 hover:text-red-500 font-bold transition-all">
               + تسجيل مصروف
             </button>
           </div> */}

           {/* Close Session Panel */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
             <h3 className="font-bold text-red-800 mb-2">إغلاق الوردية</h3>
             <p className="text-sm text-gray-500 mb-4">عند إغلاق الوردية، سيتم ترحيل المبيعات ولا يمكنك التعديل عليها.</p>
             <button 
               onClick={() => setIsClosingModalOpen(true)}
               className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-colors"
             >
               إغلاق الصندوق (Z-Report)
             </button>
           </div>
        </div>
      </div>

      {/* Close Session Modal */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-xl text-gray-800 mb-4">تأكيد إغلاق الصندوق</h3>
            
            <div className="bg-yellow-50 p-4 rounded-xl mb-6 flex gap-3 items-start">
              <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-yellow-800 text-sm">المبلغ المتوقع في الدرج</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{totals.balance.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الفعلي (العد النقدي)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg text-xl font-bold text-center focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="0.00"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
                autoFocus
              />
              {closingAmount && (
                 <div className="mt-2 text-center text-sm font-medium">
                   الفرق (العجز/الزيادة): 
                   <span className={parseFloat(closingAmount) - totals.balance < 0 ? 'text-red-600' : 'text-green-600'}>
                     {(parseFloat(closingAmount) - totals.balance).toFixed(2)}
                   </span>
                 </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsClosingModalOpen(false)}
                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
              >
                إلغاء
              </button>
              <button 
                onClick={handleCloseSession}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                تأكيد الإغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

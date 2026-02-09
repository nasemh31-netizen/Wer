
import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, FileText, User, Trash2, CheckCircle, Calculator } from 'lucide-react';
import { PaymentMethod, Customer, PaymentDetail } from '../../../types';

interface PaymentModalProps {
  total: number;
  customer: Customer | null;
  onClose: () => void;
  onConfirm: (status: any, method: PaymentMethod, paidAmount: number, paymentDetails: PaymentDetail[]) => void;
  isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  total, 
  customer, 
  onClose, 
  onConfirm, 
  isProcessing 
}) => {
  // State for split payments
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [currentAmount, setCurrentAmount] = useState<string>('');
  
  // Numpad Logic
  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setCurrentAmount('');
    } else if (val === 'back') {
      setCurrentAmount(prev => prev.slice(0, -1));
    } else {
      setCurrentAmount(prev => prev + val);
    }
  };

  // Add Payment Method to list
  const addPayment = (method: PaymentMethod) => {
    let amountToAdd = currentAmount ? parseFloat(currentAmount) : remaining;
    
    // Validate
    if (amountToAdd <= 0) return;
    if (method === PaymentMethod.CREDIT && !customer) {
      alert("يجب تحديد عميل للدفع الآجل");
      return;
    }

    setPayments(prev => [...prev, { method, amount: amountToAdd }]);
    setCurrentAmount(''); // Reset input
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = parseFloat((total - totalPaid).toFixed(2));
  const change = remaining < 0 ? Math.abs(remaining) : 0;
  const isPaidEnough = remaining <= 0;

  // Auto-focus logic for quick Cash
  useEffect(() => {
    if (payments.length === 0) {
      setCurrentAmount(total.toString());
    }
  }, [total]);

  const handleFinalize = () => {
    if (!isPaidEnough && customer) {
      // Allow credit if remaining > 0 and customer exists (Auto-add credit transaction?)
      // For now, let's force user to explicitly add Credit payment for the remainder
      if (confirm(`المبلغ المتبقي ${remaining.toFixed(2)} د.م سيتم تسجيله كذمة على العميل؟`)) {
        const finalPayments = [...payments, { method: PaymentMethod.CREDIT, amount: remaining }];
        onConfirm('POSTED', PaymentMethod.MIXED, total, finalPayments);
      }
      return;
    } else if (!isPaidEnough) {
      alert('المبلغ المدفوع غير كافٍ ولا يوجد عميل لتسجيل الذمة.');
      return;
    }

    // Normal full payment
    const finalMethod = payments.length === 1 ? payments[0].method : PaymentMethod.MIXED;
    onConfirm('POSTED', finalMethod, totalPaid, payments);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDE: Summary & List */}
        <div className="w-full md:w-1/2 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-xl text-gray-800">ملخص الدفع</h3>
             <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full"><X /></button>
          </div>
          
          <div className="p-6 space-y-4 flex-1 overflow-auto">
             {/* Big Total */}
             <div className="text-center">
               <span className="text-gray-500 text-sm">المطلوب سداده</span>
               <div className="text-5xl font-bold text-gray-900 font-mono tracking-tighter">{total.toFixed(2)} <span className="text-lg text-gray-400">DH</span></div>
             </div>

             {/* Payment List */}
             <div className="space-y-2 mt-4">
               {payments.map((p, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-in slide-in-from-left-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${p.method === 'CASH' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {p.method === 'CASH' ? <Banknote size={16} /> : <CreditCard size={16} />}
                      </div>
                      <span className="font-bold text-gray-700">
                        {p.method === 'CASH' ? 'Espèce (نقدي)' : p.method === 'CARD' ? 'Carte (شبكة)' : p.method === 'CREDIT' ? 'Crédit (آجل)' : 'Chèque'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{p.amount.toFixed(2)}</span>
                      <button onClick={() => removePayment(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                 </div>
               ))}
               {payments.length === 0 && (
                 <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                   لم يتم إضافة مدفوعات بعد
                 </div>
               )}
             </div>
          </div>

          {/* Footer Stats */}
          <div className="p-4 bg-white border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-600">
               <span>المدفوع:</span>
               <span className="font-bold">{totalPaid.toFixed(2)}</span>
            </div>
            {remaining > 0 ? (
               <div className="flex justify-between text-red-600 text-lg font-bold">
                 <span>المتبقي:</span>
                 <span>{remaining.toFixed(2)}</span>
               </div>
            ) : (
               <div className="flex justify-between text-green-600 text-lg font-bold">
                 <span>الباقي للعميل (الصرف):</span>
                 <span>{change.toFixed(2)}</span>
               </div>
            )}
            
            <button 
              onClick={handleFinalize}
              disabled={isProcessing || (remaining > 0 && !customer)}
              className={`w-full py-4 rounded-xl font-bold text-xl text-white shadow-lg transition-all mt-2 flex items-center justify-center gap-2 ${remaining > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <CheckCircle />
              {isProcessing ? 'جاري الحفظ...' : 'إتمام الفاتورة'}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Numpad & Methods */}
        <div className="w-full md:w-1/2 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
             <div className="relative">
                <input 
                  type="text" 
                  readOnly 
                  value={currentAmount}
                  placeholder="أدخل المبلغ..." 
                  className="w-full text-right text-3xl font-bold p-4 bg-white border-2 border-blue-100 rounded-xl focus:border-blue-500 outline-none text-gray-800 placeholder-gray-300" 
                />
                <Calculator className="absolute left-4 top-5 text-gray-300" />
             </div>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4">
             {/* Payment Methods */}
             <div className="grid grid-cols-2 gap-3 h-1/4">
                <button onClick={() => addPayment(PaymentMethod.CASH)} className="bg-green-50 border-2 border-green-100 hover:border-green-300 text-green-700 rounded-xl flex flex-col items-center justify-center font-bold transition-all active:scale-95">
                   <Banknote size={24} className="mb-1" /> نقدي (Espèce)
                </button>
                <button onClick={() => addPayment(PaymentMethod.CARD)} className="bg-blue-50 border-2 border-blue-100 hover:border-blue-300 text-blue-700 rounded-xl flex flex-col items-center justify-center font-bold transition-all active:scale-95">
                   <CreditCard size={24} className="mb-1" /> بطاقة (Carte)
                </button>
             </div>
             
             {/* Numpad */}
             <div className="grid grid-cols-3 gap-3 flex-1">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => handleNumpad(n.toString())} className="bg-white border border-gray-200 rounded-xl text-2xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm">
                    {n}
                  </button>
                ))}
                <button onClick={() => handleNumpad('C')} className="bg-red-50 text-red-600 rounded-xl font-bold text-xl hover:bg-red-100">C</button>
                <button onClick={() => handleNumpad('0')} className="bg-white border border-gray-200 rounded-xl text-2xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm">0</button>
                <button onClick={() => handleNumpad('.')} className="bg-white border border-gray-200 rounded-xl text-2xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm">.</button>
             </div>
             
             {/* Secondary Methods */}
             <div className="grid grid-cols-2 gap-3 h-16">
               <button onClick={() => addPayment(PaymentMethod.CHECK)} className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-gray-100">
                  <FileText size={18} /> شيك (Chèque)
               </button>
               <button onClick={() => addPayment(PaymentMethod.CREDIT)} className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-gray-100">
                  <User size={18} /> آجل (Crédit)
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

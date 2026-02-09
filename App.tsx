
import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import { Header } from './components/Header';
import { HomeScreen } from './screens/Home/HomeScreen';
import { SalesScreen } from './screens/Sales/SalesScreen';
import { PurchasesScreen } from './screens/Purchases/PurchasesScreen';
import { InventoryScreen } from './screens/Inventory/InventoryScreen';
import { CustomersScreen } from './screens/Partners/CustomersScreen';
import { SuppliersScreen } from './screens/Partners/SuppliersScreen';
import { CashboxScreen } from './screens/Cashbox/CashboxScreen';
import { ExpensesScreen } from './screens/Expenses/ExpensesScreen';
import { ReportsScreen } from './screens/Reports/ReportsScreen';
import { LoginScreen } from './screens/Auth/LoginScreen';
import { 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  RefreshCw, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { seedDatabase } from './data/seed';
import { useSessionStore } from './store/useSessionStore';

const PermissionScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [status, setStatus] = useState<'IDLE' | 'REQUESTING' | 'DENIED' | 'ERROR' | 'GRANTED'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  // Check current permission status on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            setStatus('GRANTED');
            setTimeout(onComplete, 500);
          }
        }).catch(err => console.warn("Permissions API not supported or error", err));
    }
  }, [onComplete]);

  const requestCamera = async () => {
    setStatus('REQUESTING');
    setErrorMessage('');

    // Secure Context Check (Browsers block camera on HTTP)
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
       setStatus('ERROR');
       setErrorMessage('المتصفح يرفض تشغيل الكاميرا لأن الاتصال غير آمن (يجب استخدام HTTPS).');
       return;
    }

    try {
      // Simplest possible call to trigger the browser prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If successful, stop immediately and proceed
      stream.getTracks().forEach(track => track.stop());
      
      setStatus('GRANTED');
      setTimeout(onComplete, 600);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setStatus('DENIED');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
        setErrorMessage('تم رفض الوصول للكاميرا. المتصفح لن يظهر الطلب مرة أخرى تلقائياً.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('لم يتم العثور على كاميرا في هذا الجهاز.');
      } else {
        setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء طلب الكاميرا.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-cairo overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-700 ${status === 'GRANTED' ? 'bg-green-100 text-green-600 scale-110' : 'bg-blue-50 text-blue-600 shadow-inner'}`}>
          {status === 'GRANTED' ? <CheckCircle2 size={56} /> : <Camera size={48} />}
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">إعداد الكاميرا</h1>
        
        {status === 'GRANTED' ? (
           <p className="text-green-600 font-bold animate-pulse text-lg">تم تفعيل الصلاحيات، جاري الدخول...</p>
        ) : (
           <p className="text-slate-500 mb-8 leading-relaxed text-lg">
             نحتاج للوصول إلى الكاميرا لمسح باركود المنتجات بسرعة. اضغط على الزر أدناه ثم اختر <b>"سماح"</b>.
           </p>
        )}

        {status === 'DENIED' && (
          <div className="bg-red-50 text-red-700 p-5 rounded-2xl text-sm mb-8 border border-red-100 animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center justify-center gap-2 mb-4">
                <AlertTriangle size={24} className="shrink-0" />
                <p className="font-bold text-base">{errorMessage}</p>
             </div>
             
             <div className="text-right text-xs text-slate-600 bg-white/80 p-4 rounded-xl border border-red-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1 font-black text-slate-800 border-b border-red-100 pb-2">
                  <Lock size={16} className="text-red-500" />
                  خطوات فك الحظر اليدوي:
                </div>
                <p>إذا لم تظهر نافذة الطلب، اتبع الآتي:</p>
                <ul className="space-y-3 pr-4 list-disc">
                  <li>انقر على أيقونة <b>القفل (Lock)</b> الموجودة في شريط العنوان (بجانب الرابط).</li>
                  <li>ابحث عن إعداد <b>"الكاميرا"</b>.</li>
                  <li>قم بتغيير الحالة إلى <b>"سماح" (Allow)</b>.</li>
                  <li>اضغط على زر <b>إعادة تحميل الصفحة</b> بالأسفل.</li>
                </ul>
             </div>
          </div>
        )}

        <div className="space-y-4">
          {status !== 'GRANTED' && status !== 'DENIED' && (
            <button 
              onClick={requestCamera}
              disabled={status === 'REQUESTING'}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
            >
              {status === 'REQUESTING' ? 'جاري فتح الطلب...' : 'تفعيل الكاميرا الآن'}
              {status === 'IDLE' && <ShieldCheck size={24} />}
            </button>
          )}

          {status === 'DENIED' && (
             <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              إعادة تحميل الصفحة
            </button>
          )}
          
          <button 
            onClick={onComplete}
            className="w-full py-2 font-bold text-sm text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle size={14} />
            المتابعة بدون كاميرا (إدخال يدوي)
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { userId } = useSessionStore();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);

  useEffect(() => {
    seedDatabase().catch(err => console.error('Seeding failed:', err));
  }, []);

  const navigate = (route: AppRoute) => {
    setCurrentRoute(route);
  };

  const goBack = () => {
    setCurrentRoute(AppRoute.HOME);
  };

  const getScreenTitle = (route: AppRoute) => {
    switch (route) {
      case AppRoute.HOME: return 'MicroPOS';
      case AppRoute.SALES: return 'نقطة البيع';
      case AppRoute.PURCHASES: return 'المشتريات';
      case AppRoute.CUSTOMERS: return 'العملاء';
      case AppRoute.SUPPLIERS: return 'الموردين';
      case AppRoute.CASHBOX: return 'الصندوق';
      case AppRoute.EXPENSES: return 'المصروفات';
      case AppRoute.INVENTORY: return 'المخزون';
      case AppRoute.REPORTS: return 'التقارير';
      default: return 'MicroPOS';
    }
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <HomeScreen onNavigate={navigate} />;
      case AppRoute.SALES:
        return <SalesScreen />;
      case AppRoute.INVENTORY:
        return <InventoryScreen />;
      case AppRoute.PURCHASES:
        return <PurchasesScreen />;
      case AppRoute.CUSTOMERS:
        return <CustomersScreen />;
      case AppRoute.SUPPLIERS:
        return <SuppliersScreen />;
      case AppRoute.CASHBOX:
        return <CashboxScreen />;
      case AppRoute.EXPENSES:
        return <ExpensesScreen />;
      case AppRoute.REPORTS:
        return <ReportsScreen />;
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  if (!permissionGranted) {
    return <PermissionScreen onComplete={() => setPermissionGranted(true)} />;
  }

  if (!hasLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setHasLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 font-cairo">
      {/* Fixed Header */}
      <Header 
        title={getScreenTitle(currentRoute)} 
        showBack={currentRoute !== AppRoute.HOME}
        onBack={goBack}
      />
      
      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar animate-fade-in relative w-full bg-gray-50">
        {renderScreen()}
      </main>
    </div>
  );
}

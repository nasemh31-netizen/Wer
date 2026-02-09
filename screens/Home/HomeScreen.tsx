
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ShoppingCart, 
  Truck, 
  Users, 
  Handshake, 
  Wallet, 
  Vault, 
  Package, 
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { DashboardCard } from '../../components/DashboardCard';
import { AppRoute } from '../../types';
import { db } from '../../data/db/dexie';

interface HomeScreenProps {
  onNavigate: (route: AppRoute) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  // Real-time Stats for Dashboard
  const stats = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = await db.invoices
      .where('date').aboveOrEqual(today)
      .filter(i => i.type === 'SALE')
      .toArray();
    
    const totalToday = todaySales.reduce((sum, s) => sum + s.grand_total, 0);
    const lowStock = await db.products.filter(p => (p.stock || 0) <= p.min_stock).count();
    const activeCustomers = await db.partners.where('type').equals('CUSTOMER').count();

    return { totalToday, salesCount: todaySales.length, lowStock, activeCustomers };
  });

  const menuItems = [
    { title: 'نقطة البيع', route: AppRoute.SALES, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'المخزون', route: AppRoute.INVENTORY, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'المشتريات', route: AppRoute.PURCHASES, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'الصندوق', route: AppRoute.CASHBOX, icon: Vault, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'العملاء', route: AppRoute.CUSTOMERS, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'المصروفات', route: AppRoute.EXPENSES, icon: Wallet, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'التقارير', route: AppRoute.REPORTS, icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-50' },
    { title: 'الموردين', route: AppRoute.SUPPLIERS, icon: Handshake, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-cairo">
      
      {/* --- DASHBOARD STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold mb-1">مبيعات اليوم</p>
            <h3 className="text-2xl font-black text-blue-700">{stats?.totalToday.toFixed(2) || '0.00'}</h3>
            <div className="flex items-center gap-1 text-green-500 text-xs mt-1 font-bold">
              <ArrowUpRight size={14} /> +12% عن أمس
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
             <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold mb-1">عدد الفواتير</p>
            <h3 className="text-2xl font-black text-slate-800">{stats?.salesCount || 0}</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium">عملية بيع ناجحة</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center">
             <ShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-bold mb-1">نواقص المخزون</p>
            <h3 className="text-2xl font-black text-red-600">{stats?.lowStock || 0}</h3>
            <div className="flex items-center gap-1 text-red-400 text-xs mt-1 font-bold">
              <ArrowDownRight size={14} /> يحتاج طلب شراء
            </div>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
             <Package size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-lg text-white flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-bold mb-1">إجمالي العملاء</p>
            <h3 className="text-2xl font-black">{stats?.activeCustomers || 0}</h3>
            <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded mt-2 transition-colors">عرض الكل</button>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
             <Users size={24} />
          </div>
        </div>
      </div>

      {/* --- QUICK ACTIONS --- */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">القائمة الرئيسية</h2>
        <button 
          onClick={() => onNavigate(AppRoute.SALES)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 hover:scale-105 transition-all"
        >
          <Plus size={18} /> فاتورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuItems.map((item, index) => (
          <DashboardCard
            key={index}
            title={item.title}
            Icon={item.icon}
            color={item.color}
            onClick={() => onNavigate(item.route)}
          />
        ))}
      </div>

      {/* --- RECENT ACTIVITY (Optional Preview) --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <span className="font-bold text-gray-700">آخر عمليات البيع</span>
          <button onClick={() => onNavigate(AppRoute.REPORTS)} className="text-blue-600 text-xs font-bold hover:underline">مشاهدة الكل</button>
        </div>
        <div className="p-4 text-center text-gray-400 text-sm italic">
          يتم تحديث البيانات لحظياً من قاعدة البيانات المحلية...
        </div>
      </div>

    </div>
  );
};

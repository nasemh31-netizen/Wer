
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db/dexie';
import { BarChart3, Calendar, Download, FileSpreadsheet, TrendingUp, Package, Users } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { exportToCSV } from '../../lib/csvExport';

export const ReportsScreen: React.FC = () => {
  const { orgId } = useSessionStore();
  const [activeTab, setActiveTab] = useState<'SALES' | 'PRODUCTS' | 'CUSTOMERS'>('SALES');
  
  // Date Range (Defaults to current month)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Queries
  const invoices = useLiveQuery(
    async () => {
      const all = await db.invoices
        .where('org_id').equals(orgId)
        .filter(i => i.date >= startDate && i.date <= endDate + 'T23:59:59')
        .toArray();
      return all;
    },
    [orgId, startDate, endDate]
  );

  const invoiceItems = useLiveQuery(
    async () => {
       if(!invoices) return [];
       const ids = invoices.map(i => i.id);
       const items = await db.invoice_items.where('invoice_id').anyOf(ids).toArray();
       return items;
    },
    [invoices]
  );

  // --- Reports Logic ---

  // 1. Sales Report
  const salesReportData = invoices?.map(inv => ({
    'رقم الفاتورة': inv.invoice_number,
    'التاريخ': new Date(inv.date).toLocaleDateString('ar-SA'),
    'النوع': inv.type,
    'الحالة': inv.status,
    'المجموع': inv.subtotal.toFixed(2),
    'الضريبة': inv.tax_total.toFixed(2),
    'الخصم': inv.discount_total.toFixed(2),
    'الإجمالي': inv.grand_total.toFixed(2),
    'طريقة الدفع': inv.payment_method
  })) || [];

  const totalSales = invoices?.reduce((sum, i) => sum + i.grand_total, 0) || 0;

  // 2. Product Sales
  const productStats = React.useMemo(() => {
    if (!invoiceItems) return [];
    const stats: Record<string, {name: string, qty: number, total: number}> = {};
    
    invoiceItems.forEach(item => {
      if (!stats[item.product_id]) {
        stats[item.product_id] = { name: item.product_name, qty: 0, total: 0 };
      }
      stats[item.product_id].qty += item.qty;
      stats[item.product_id].total += item.total;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [invoiceItems]);

  const productReportData = productStats.map(p => ({
     'اسم المنتج': p.name,
     'الكمية المباعة': p.qty,
     'إجمالي المبيعات': p.total.toFixed(2)
  }));

  // Render Functions
  const renderToolbar = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <Calendar size={18} className="text-gray-500" />
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="bg-transparent text-sm font-bold outline-none text-gray-700"
          />
          <span className="text-gray-400">إلى</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="bg-transparent text-sm font-bold outline-none text-gray-700"
          />
        </div>
      </div>

      <button 
        onClick={() => {
           if(activeTab === 'SALES') exportToCSV(salesReportData, 'Sales_Report');
           if(activeTab === 'PRODUCTS') exportToCSV(productReportData, 'Products_Report');
        }}
        className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
      >
        <FileSpreadsheet size={18} />
        تصدير Excel
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
           <BarChart3 size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h2>
          <p className="text-gray-500 text-sm">عرض وتحليل أداء المبيعات</p>
        </div>
      </div>

      {renderToolbar()}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-white p-5 rounded-xl shadow-sm border-r-4 border-blue-500 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">إجمالي المبيعات (الفترة المحددة)</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalSales.toFixed(2)}</h3>
            </div>
            <TrendingUp className="text-blue-500 opacity-20" size={40} />
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border-r-4 border-orange-500 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">عدد الفواتير</p>
              <h3 className="text-2xl font-bold text-gray-800">{invoices?.length || 0}</h3>
            </div>
            <FileSpreadsheet className="text-orange-500 opacity-20" size={40} />
         </div>
         <div className="bg-white p-5 rounded-xl shadow-sm border-r-4 border-purple-500 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm mb-1">المنتجات المباعة</p>
              <h3 className="text-2xl font-bold text-gray-800">{productStats.length}</h3>
            </div>
            <Package className="text-purple-500 opacity-20" size={40} />
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-0">
        <button 
          onClick={() => setActiveTab('SALES')} 
          className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 ${activeTab === 'SALES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          سجل المبيعات
        </button>
        <button 
          onClick={() => setActiveTab('PRODUCTS')} 
          className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 ${activeTab === 'PRODUCTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          الأكثر مبيعاً
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white flex-1 overflow-auto border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-4">
        
        {activeTab === 'SALES' && (
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">النوع</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y">
               {invoices?.map(inv => (
                 <tr key={inv.id} className="hover:bg-gray-50">
                   <td className="p-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                   <td className="p-3 text-gray-500">{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                   <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${inv.type.includes('RETURN') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {inv.type === 'SALE' ? 'مبيعات' : 'مرتجع'}
                      </span>
                   </td>
                   <td className="p-3 text-gray-600">{inv.payment_method}</td>
                   <td className="p-3 font-bold">{inv.grand_total.toFixed(2)}</td>
                 </tr>
               ))}
               {(!invoices || invoices.length === 0) && (
                 <tr><td colSpan={5} className="text-center p-8 text-gray-400">لا توجد بيانات في هذه الفترة</td></tr>
               )}
            </tbody>
          </table>
        )}

        {activeTab === 'PRODUCTS' && (
           <table className="w-full text-right text-sm">
           <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0">
             <tr>
               <th className="p-3">الترتيب</th>
               <th className="p-3">المنتج</th>
               <th className="p-3">الكمية المباعة</th>
               <th className="p-3">إجمالي القيمة</th>
             </tr>
           </thead>
           <tbody className="divide-y">
              {productStats.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-400 w-16">#{idx + 1}</td>
                  <td className="p-3 font-bold text-gray-700">{p.name}</td>
                  <td className="p-3">{p.qty}</td>
                  <td className="p-3 font-bold text-blue-600">{p.total.toFixed(2)}</td>
                </tr>
              ))}
           </tbody>
         </table>
        )}
      </div>
    </div>
  );
};

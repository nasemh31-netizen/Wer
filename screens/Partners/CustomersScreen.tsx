
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Wallet, 
  FileText, 
  ClipboardCheck, 
  ChevronLeft, 
  Users,
  ArrowRight
} from 'lucide-react';
import { db } from '../../data/db/dexie';
import { PartnerList } from './PartnerList';
import { PartnerForm } from './PartnerForm';
import { Partner, PartnerType, SyncStatus } from '../../types';
import { PartnerRepository } from '../../data/repositories/dexieImpl';
import { useSessionStore } from '../../store/useSessionStore';

type ViewState = 'MENU' | 'ADD' | 'LIST' | 'RECEIVABLES' | 'OPENING_BALANCES' | 'REPORTS';

export const CustomersScreen: React.FC = () => {
  const { orgId } = useSessionStore();
  const [currentView, setCurrentView] = useState<ViewState>('MENU');
  const [selectedPartner, setSelectedPartner] = useState<Partner | undefined>(undefined);

  // --- Helpers ---
  const MenuItem = ({ title, icon: Icon, onClick, color = "text-gray-600" }: { title: string, icon: any, onClick: () => void, color?: string }) => (
    <button 
      onClick={onClick}
      className="w-full bg-white p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-all first:rounded-t-xl last:rounded-b-xl last:border-0"
    >
      <div className="flex items-center gap-4">
        <Icon size={24} className={color} />
        <span className="text-gray-800 font-medium text-right">{title}</span>
      </div>
      <ChevronLeft className="text-gray-300" size={20} />
    </button>
  );

  // --- Sub-View: Receivables (Customers with debt) ---
  const ReceivablesView = () => {
    const debtors = useLiveQuery(
      () => db.partners
        .where('org_id').equals(orgId)
        .filter(p => p.type === PartnerType.CUSTOMER && (p.balance || 0) > 0)
        .toArray(),
      [orgId]
    );

    const totalDebt = debtors?.reduce((sum, p) => sum + (p.balance || 0), 0) || 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b bg-red-50 flex justify-between items-center">
          <h3 className="font-bold text-red-800 flex items-center gap-2">
            <Wallet size={20} />
            ذمم العملاء (مبالغ لنا)
          </h3>
          <span className="bg-red-200 text-red-800 px-3 py-1 rounded-lg font-bold">
            {totalDebt.toFixed(2)}
          </span>
        </div>
        <div className="overflow-auto flex-1 p-4">
          <table className="w-full text-right">
            <thead className="text-gray-500 text-sm border-b">
              <tr>
                <th className="pb-2">العميل</th>
                <th className="pb-2">الهاتف</th>
                <th className="pb-2 text-red-600">المبلغ المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {debtors?.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-gray-400">لا توجد ذمم على العملاء</td></tr>
              ) : (
                debtors?.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-gray-500 text-sm">{p.phone || '-'}</td>
                    <td className="py-3 font-bold text-red-600">{(p.balance || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- Sub-View: Placeholder for Reports ---
  const PlaceholderReport = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow p-8 text-center text-gray-400">
      <FileText size={48} className="mb-4 opacity-50" />
      <h3 className="text-xl font-bold text-gray-600 mb-2">{title}</h3>
      <p>هذا التقرير قيد التطوير وسيتاح في التحديث القادم.</p>
    </div>
  );

  // --- Navigation Handlers ---
  const goBack = () => {
    setCurrentView('MENU');
    setSelectedPartner(undefined);
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setCurrentView('ADD'); // Use Add form for editing
  };

  // --- Main Render ---
  if (currentView !== 'MENU') {
    return (
      <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
        <button 
          onClick={goBack}
          className="self-start mb-4 flex items-center gap-1 text-gray-500 hover:text-blue-600 font-bold"
        >
          <ArrowRight size={20} />
          العودة للقائمة
        </button>

        <div className="flex-1">
          {currentView === 'ADD' && (
            <div className="max-w-xl mx-auto">
              <PartnerForm 
                type={PartnerType.CUSTOMER}
                partner={selectedPartner}
                onClose={goBack}
                onSave={() => { alert('تم الحفظ'); goBack(); }}
              />
            </div>
          )}

          {currentView === 'LIST' && (
            <PartnerList 
              type={PartnerType.CUSTOMER}
              onAdd={() => setCurrentView('ADD')}
              onEdit={handleEdit}
            />
          )}

          {currentView === 'RECEIVABLES' && <ReceivablesView />}
          
          {/* Reuse List for Opening Balances simply to edit them for now */}
          {currentView === 'OPENING_BALANCES' && (
             <PartnerList 
               type={PartnerType.CUSTOMER}
               onAdd={() => setCurrentView('ADD')}
               onEdit={handleEdit}
             />
          )}

          {currentView === 'REPORTS' && <PlaceholderReport title="التقارير التفصيلية" />}
        </div>
      </div>
    );
  }

  // --- Menu View ---
  return (
    <div className="p-4 max-w-lg mx-auto pt-8">
      
      {/* Header Icon */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Users size={48} className="text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">العملاء</h2>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        <MenuItem 
          title="اضافة عميل جديد" 
          icon={Plus} 
          color="text-green-600"
          onClick={() => setCurrentView('ADD')} 
        />

        <MenuItem 
          title="الأرصدة الافتتاحية والمبالغ النقدية" 
          icon={RefreshCw} 
          color="text-gray-600"
          onClick={() => setCurrentView('OPENING_BALANCES')} 
        />

        <MenuItem 
          title="ذمم العملاء - المبالغ المتبقية" 
          icon={Wallet} 
          color="text-amber-600"
          onClick={() => setCurrentView('RECEIVABLES')} 
        />

        <MenuItem 
          title="ذمم العملاء - تقرير" 
          icon={FileText} 
          onClick={() => setCurrentView('REPORTS')} 
        />

        <MenuItem 
          title="العملاء المتبقي لهم أرصدة - تقرير" 
          icon={FileText} 
          onClick={() => setCurrentView('REPORTS')} 
        />

        <MenuItem 
          title="فحص ارصدة العملاء" 
          icon={ClipboardCheck} 
          onClick={() => setCurrentView('RECEIVABLES')} 
        />

        <MenuItem 
          title="عرض العملاء" 
          icon={Search} 
          color="text-blue-600"
          onClick={() => setCurrentView('LIST')} 
        />

      </div>
    </div>
  );
};

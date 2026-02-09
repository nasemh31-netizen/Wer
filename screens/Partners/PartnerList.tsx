
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Plus, Edit, UserCircle2, Phone } from 'lucide-react';
import { db } from '../../data/db/dexie';
import { Partner, PartnerType } from '../../types';
import { useSessionStore } from '../../store/useSessionStore';

interface PartnerListProps {
  type: PartnerType;
  onEdit: (partner: Partner) => void;
  onAdd: () => void;
}

export const PartnerList: React.FC<PartnerListProps> = ({ type, onEdit, onAdd }) => {
  const { orgId } = useSessionStore();
  const [searchTerm, setSearchTerm] = useState('');

  const partners = useLiveQuery(
    () => db.partners.where('org_id').equals(orgId).filter(p => p.type === type).toArray()
  , [orgId, type]);

  const filteredPartners = partners?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.phone && p.phone.includes(searchTerm))
  );

  const title = type === PartnerType.CUSTOMER ? 'العملاء' : 'الموردين';
  const addTitle = type === PartnerType.CUSTOMER ? 'إضافة عميل' : 'إضافة مورد';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder={`بحث في ${title}...`}
            className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>
        <button 
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          {addTitle}
        </button>
      </div>

      {/* Grid List */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
        {filteredPartners?.map(partner => (
          <div key={partner.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50/50">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <UserCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{partner.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Phone size={12} />
                    <span>{partner.phone || 'لا يوجد هاتف'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onEdit(partner)}
                className="text-gray-400 hover:text-blue-600 p-1"
              >
                <Edit size={16} />
              </button>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-500">الرصيد الحالي</span>
              <span className={`font-bold ${(partner.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(partner.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        {filteredPartners?.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400">
            لا توجد بيانات
          </div>
        )}
      </div>
    </div>
  );
};

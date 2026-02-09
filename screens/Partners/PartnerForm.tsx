
import React, { useState, useEffect } from 'react';
import { Save, X, Phone, User, FileText } from 'lucide-react';
import { Partner, PartnerType, SyncStatus } from '../../types';
import { PartnerRepository } from '../../data/repositories/dexieImpl';
import { generateId } from '../../lib/utils';
import { useSessionStore } from '../../store/useSessionStore';

interface PartnerFormProps {
  type: PartnerType;
  partner?: Partner;
  onClose: () => void;
  onSave: () => void;
}

export const PartnerForm: React.FC<PartnerFormProps> = ({ type, partner, onClose, onSave }) => {
  const { orgId } = useSessionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    tax_number: ''
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        phone: partner.phone || '',
        tax_number: partner.tax_number || ''
      });
    }
  }, [partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const partnerData: Partner = {
        id: partner?.id || generateId(),
        org_id: orgId,
        type: type,
        name: formData.name,
        phone: formData.phone,
        tax_number: formData.tax_number,
        is_active: true,
        balance: partner?.balance || 0,
        sync_status: SyncStatus.PENDING
      };

      if (partner) {
        await PartnerRepository.update(partnerData);
      } else {
        await PartnerRepository.create(partnerData);
      }
      
      onSave();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === PartnerType.CUSTOMER ? 'العميل' : 'المورد';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-lg text-gray-800">
          {partner ? `تعديل بيانات ${title}` : `إضافة ${title} جديد`}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم {title}</label>
          <div className="relative">
            <input
              required
              type="text"
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="الاسم الكامل"
            />
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
          <div className="relative">
            <input
              type="tel"
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="مثال: 05xxxxxxxx"
            />
            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        {/* Tax Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.tax_number}
              onChange={e => setFormData({...formData, tax_number: e.target.value})}
              placeholder="اختياري"
            />
            <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </div>
  );
};

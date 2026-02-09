
import React, { useState } from 'react';
import { PartnerList } from './PartnerList';
import { PartnerForm } from './PartnerForm';
import { Partner, PartnerType } from '../../types';

export const SuppliersScreen: React.FC = () => {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedPartner, setSelectedPartner] = useState<Partner | undefined>(undefined);

  const handleAdd = () => {
    setSelectedPartner(undefined);
    setView('FORM');
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setView('FORM');
  };

  const handleCloseForm = () => {
    setView('LIST');
    setSelectedPartner(undefined);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-64px)]">
      {view === 'LIST' ? (
        <PartnerList 
          type={PartnerType.SUPPLIER}
          onAdd={handleAdd} 
          onEdit={handleEdit} 
        />
      ) : (
        <div className="max-w-xl mx-auto mt-8">
          <PartnerForm 
            type={PartnerType.SUPPLIER}
            partner={selectedPartner} 
            onClose={handleCloseForm} 
            onSave={handleCloseForm} 
          />
        </div>
      )}
    </div>
  );
};

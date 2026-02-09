
import React from 'react';

interface SalesHeaderProps {
  invoiceNumber: string;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({ invoiceNumber }) => {
  return (
    <div className="bg-[#e5e7eb] px-2 py-1.5 flex gap-2 border-b border-gray-300">
      {/* Invoice Number */}
      <div className="flex items-center flex-1 h-9 bg-white rounded border border-gray-300 overflow-hidden">
        <div className="h-full px-3 flex items-center justify-center bg-[#e5e7eb] border-l border-gray-300 text-sm text-gray-700 font-bold whitespace-nowrap">
          رقم الفاتورة
        </div>
        <div className="flex-1 flex items-center justify-center font-bold text-lg text-gray-800 font-mono">
          {invoiceNumber}
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center flex-1 h-9 bg-white rounded border border-gray-300 overflow-hidden">
         <div className="h-full px-3 flex items-center justify-center bg-[#e5e7eb] border-l border-gray-300 text-sm text-gray-700 font-bold whitespace-nowrap">
          تاريخ الفاتورة
        </div>
        <div className="flex-1 flex items-center justify-center font-bold text-gray-800 dir-ltr text-sm">
          {new Date().toLocaleDateString('en-GB')}
        </div>
      </div>
    </div>
  );
};

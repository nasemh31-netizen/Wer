
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  Icon: LucideIcon;
  onClick: () => void;
  color?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, Icon, onClick, color = "text-slate-700" }) => {
  // Extract background color from text color class if possible, or default
  const bgColor = color.replace('text-', 'bg-').split(' ')[0] + '/10';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 h-44 group"
    >
      <div className={`p-4 rounded-[1.5rem] transition-colors ${bgColor} ${color} group-hover:scale-110 duration-300`}>
        <Icon size={36} strokeWidth={2} />
      </div>
      <span className="text-lg font-black text-gray-800 tracking-tight">{title}</span>
    </div>
  );
};

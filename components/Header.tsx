
import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, onMenuClick }) => {
  return (
    <header className="bg-white text-gray-900 shadow-sm sticky top-0 z-40 pt-[env(safe-area-inset-top)] border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3 flex-1">
          {showBack ? (
            <button 
              onClick={onBack}
              className="p-2 -mr-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors active:bg-blue-100"
            >
              <ChevronRight size={28} />
            </button>
          ) : (
            <button 
              onClick={onMenuClick}
              className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
          )}
          <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Right side actions can go here */}
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
               MA
            </div>
        </div>
      </div>
    </header>
  );
};

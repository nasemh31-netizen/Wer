
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ScanBarcode, User, Search, X, Plus, Package, ChevronRight, Barcode } from 'lucide-react';
import { Customer, Product, ProductBarcode } from '../../../types';
import { useSalesStore } from '../../../store/useSalesStore';
import { BarcodeScannerModal } from '../../../components/BarcodeScannerModal';
import { BarcodeParser } from '../../../services/BarcodeParser';

interface SalesToolbarProps {
  onAddProduct: (product: Product, qty?: number) => void;
  onCreateProduct: (term: string) => void;
  onCustomerClick: () => void;
  customers?: Customer[];
  products?: Product[];
  productBarcodes?: ProductBarcode[];
  invoiceNumber: string;
  orgId: string;
}

export const SalesToolbar: React.FC<SalesToolbarProps> = ({
  onAddProduct,
  onCreateProduct,
  onCustomerClick,
  customers,
  products,
  productBarcodes,
  invoiceNumber,
  orgId
}) => {
  const { getCurrentCart } = useSalesStore();
  const currentCart = getCurrentCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Search Logic ---
  const searchResults = useMemo(() => {
    if (!searchTerm || !products) return [];
    
    const lowerTerm = searchTerm.toLowerCase();
    
    // 1. Exact Barcode Match (Fastest)
    const exactBarcodeMatch = productBarcodes?.find(pb => pb.barcode === searchTerm);
    if (exactBarcodeMatch) {
      const p = products.find(prod => prod.id === exactBarcodeMatch.product_id);
      if (p) return [{ ...p, _matchType: 'exact_barcode', _factor: exactBarcodeMatch.factor || 1 }];
    }

    // 2. Scale Barcode (29xxxxx...)
    const scaleResult = BarcodeParser.parseScaleBarcode(searchTerm);
    if (scaleResult) {
       const p = products.find(prod => 
         productBarcodes?.some(b => b.barcode.includes(scaleResult.plu) && b.product_id === prod.id)
       );
       if (p) return [{ ...p, _matchType: 'scale', _weight: scaleResult.weight }];
    }

    // 3. Name or Partial Barcode Match (Limit to 5 results for UI)
    const matches = products.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(lowerTerm);
      const barcodeMatch = searchTerm.length > 3 && productBarcodes?.some(b => b.product_id === p.id && b.barcode.includes(searchTerm));
      return nameMatch || barcodeMatch;
    }).slice(0, 5);

    return matches;
  }, [searchTerm, products, productBarcodes]);

  // Handle Enter Key (Add first result or Create)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const topResult = searchResults[0];
        const qty = (topResult as any)._weight || (topResult as any)._factor || 1;
        onAddProduct(topResult, qty);
        setSearchTerm('');
        setShowResults(false);
      } else if (searchTerm.trim().length > 0) {
        onCreateProduct(searchTerm);
        setSearchTerm('');
        setShowResults(false);
      }
    }
  };

  const handleResultClick = (p: Product) => {
    onAddProduct(p);
    setSearchTerm('');
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="relative z-50">
      <div className="flex gap-3 items-center">
        
        {/* Search Bar Container */}
        <div className="flex-1 relative shadow-sm rounded-2xl bg-white transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-12 py-3.5 bg-transparent border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base font-bold"
            placeholder="بحث، باركود، أو إضافة..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if(searchTerm) setShowResults(true);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {searchTerm ? (
              <button onClick={() => { setSearchTerm(''); inputRef.current?.focus(); }} className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                <X size={14} />
              </button>
            ) : (
              <button onClick={() => setShowScanner(true)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <ScanBarcode size={22} />
              </button>
            )}
          </div>
        </div>

        {/* Customer Button */}
        <button 
          onClick={onCustomerClick}
          className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all active:scale-95 shadow-sm overflow-hidden
            ${currentCart.customer 
              ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' 
              : 'bg-white border-white text-gray-400'}`}
        >
          {currentCart.customer ? (
            <div className="text-center leading-none w-full">
              <span className="text-[10px] font-bold opacity-80 block mb-0.5">عميل</span>
              <span className="text-xs font-black truncate px-1">{currentCart.customer.name.split(' ')[0]}</span>
            </div>
          ) : (
            <User size={24} />
          )}
        </button>
      </div>

      {/* Results Dropdown */}
      {showResults && searchTerm && (
        <div className="absolute top-full left-0 right-16 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-50">
          {searchResults.length === 0 && (
            <div 
              onClick={() => onCreateProduct(searchTerm)}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">إضافة "{searchTerm}"</p>
                <p className="text-xs text-gray-500">كمنتج جديد (سريع)</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          )}

          {searchResults.map((product, idx) => (
            <div 
              key={product.id}
              onClick={() => handleResultClick(product)}
              className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${idx === 0 ? 'bg-blue-50/50' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                 {(product as any)._matchType === 'exact_barcode' ? <Barcode size={20} className="text-purple-500" /> : <Package size={20} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate text-sm">{product.name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">{product.price.toFixed(2)}</span>
                  {product.stock !== undefined && (
                     <span className={product.stock <= 0 ? 'text-red-500' : 'text-green-600'}>
                       • {product.stock} حبة
                     </span>
                  )}
                </div>
              </div>
              <div className="text-blue-600 font-bold text-sm">
                +
              </div>
            </div>
          ))}
        </div>
      )}

      {showScanner && (
        <BarcodeScannerModal 
          onClose={() => setShowScanner(false)} 
          onScan={(code) => {
            setSearchTerm(code);
            setShowScanner(false);
          }} 
        />
      )}
    </div>
  );
};

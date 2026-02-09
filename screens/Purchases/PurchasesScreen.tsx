
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Search, ShoppingCart, User, X, Save, CheckCircle, Loader2, Truck } from 'lucide-react';
import { Product, Partner, PaymentMethod, InvoiceStatus, Invoice, InvoiceItem, SyncStatus, PartnerType } from '../../types';
import { db } from '../../data/db/dexie';
import { InvoiceRepository } from '../../data/repositories/dexieImpl';
import { generateId } from '../../lib/utils';
import { useSessionStore } from '../../store/useSessionStore';

export const PurchasesScreen: React.FC = () => {
  // Global State
  const { orgId, branchId } = useSessionStore();

  // Local State
  const [cart, setCart] = useState<{ product: Product; qty: number; cost: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Partner | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live Data Queries
  const products = useLiveQuery(
    () => db.products.where('org_id').equals(orgId).toArray()
  , [orgId]);

  const suppliers = useLiveQuery(
    () => db.partners.where('org_id').equals(orgId).filter(p => p.type === PartnerType.SUPPLIER).toArray()
  , [orgId]);

  // Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      }
      return [...prev, { product, qty: 1, cost: product.cost }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;

    cart.forEach(item => {
      // In Purchases, we calculate based on COST
      const lineTotal = item.cost * item.qty;
      // Assume Cost is tax-exclusive for simplicity in this MVP, or tax inclusive depending on region.
      // Let's assume Cost is Exclusive of Tax for B2B usually, but for simplicity let's match Sales logic:
      // Tax Amount = (Total * Rate) 
      const taxAmount = lineTotal * item.product.tax_rate; 
      
      subtotal += lineTotal;
      taxTotal += taxAmount;
    });

    return {
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal
    };
  }, [cart]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerTerm));
  }, [products, searchTerm]);

  const handleCheckout = async (status: InvoiceStatus) => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const invoiceId = generateId();
      const invoice: Invoice = {
        id: invoiceId,
        org_id: orgId,
        invoice_number: `PUR-${Date.now().toString().slice(-6)}`,
        type: 'PURCHASE',
        partner_id: selectedSupplier?.id,
        warehouse_id: branchId,
        status: status,
        payment_method: status === InvoiceStatus.DRAFT ? PaymentMethod.CASH : paymentMethod,
        date: new Date().toISOString(),
        subtotal: totals.subtotal,
        tax_total: totals.taxTotal,
        discount_total: 0,
        grand_total: totals.grandTotal,
        paid_amount: status === InvoiceStatus.POSTED && paymentMethod === PaymentMethod.CASH 
          ? (paidAmount ? parseFloat(paidAmount) : totals.grandTotal)
          : 0,
        created_by: 'current-user-id',
        sync_status: SyncStatus.PENDING
      };

      const items: InvoiceItem[] = cart.map(cartItem => ({
        id: generateId(),
        invoice_id: invoiceId,
        product_id: cartItem.product.id,
        product_name: cartItem.product.name,
        qty: cartItem.qty,
        price: cartItem.product.price, // Sales price reference
        cost: cartItem.cost, // Actual Purchase Cost
        tax_rate: cartItem.product.tax_rate,
        tax_amount: cartItem.cost * cartItem.qty * cartItem.product.tax_rate,
        total: cartItem.cost * cartItem.qty
      }));

      await InvoiceRepository.create(invoice, items);
      
      // Reset
      setCart([]);
      setIsCheckoutOpen(false);
      setPaidAmount('');
      setPaymentMethod(PaymentMethod.CASH);
      setSelectedSupplier(null);
      alert('تم تسجيل فاتورة الشراء وتحديث المخزون');
    } catch (error) {
      console.error('Checkout Error:', error);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!products) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-100 relative">
      
      {/* LEFT: Product Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="بحث عن منتج لإضافته للشراء..."
            className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map(product => {
            const currentStock = product.stock || 0;
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-between h-36 border border-transparent hover:border-blue-500"
              >
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-1 font-bold text-lg">
                  {product.name.charAt(0)}
                </div>
                <div className="text-center w-full">
                  <span className="font-medium text-sm line-clamp-2 block h-10">{product.name}</span>
                  <div className="flex justify-between items-center w-full mt-2 px-1">
                    <span className="text-gray-500 text-xs">التكلفة: {product.cost.toFixed(2)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      مخزون: {currentStock}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-full md:w-96 bg-white shadow-xl flex flex-col border-l border-gray-200 z-10">
        
        {/* Supplier Header */}
        <div className="p-3 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center justify-between text-orange-900">
            <div className="flex items-center gap-2">
              <Truck size={18} />
              <select 
                className="bg-transparent font-bold focus:outline-none cursor-pointer max-w-[150px]"
                onChange={(e) => {
                  const sup = suppliers?.find(s => s.id === e.target.value);
                  setSelectedSupplier(sup || null);
                }}
                value={selectedSupplier?.id || ''}
              >
                <option value="">مورد نقدي (افتراضي)</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-20" />
              <p>سلة المشتريات فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-white rounded-md px-2 py-1 border border-gray-200">
                    <button onClick={() => updateQty(item.product.id, -1)} className="text-gray-500 hover:text-blue-600 font-bold">-</button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="text-gray-500 hover:text-blue-600 font-bold">+</button>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{(item.cost * item.qty).toFixed(2)}</div>
                    <div className="text-[10px] text-gray-500">سعر التكلفة</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="space-y-1 mb-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>المجموع (قبل الضريبة)</span>
              <span>{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>الضريبة (تقديرية)</span>
              <span>{totals.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-orange-900 mt-2 pt-2 border-t border-gray-100">
              <span>إجمالي الفاتورة</span>
              <span>{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            إتمام الشراء
          </button>
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {isCheckoutOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
            <div className="p-4 bg-orange-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">تأكيد فاتورة شراء</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Payment Method Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                <div className="flex p-1 bg-gray-100 rounded-lg">
                  <button 
                    onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${paymentMethod === PaymentMethod.CASH ? 'bg-white shadow text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    نقداً (Cash)
                  </button>
                  <button 
                    onClick={() => setPaymentMethod(PaymentMethod.CREDIT)}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${paymentMethod === PaymentMethod.CREDIT ? 'bg-white shadow text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    آجل (Credit)
                  </button>
                </div>
              </div>

              {/* Amount Inputs */}
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-orange-800 font-medium">المبلغ المستحق</span>
                  <span className="text-2xl font-bold text-orange-900">{totals.grandTotal.toFixed(2)}</span>
                </div>

                {paymentMethod === PaymentMethod.CASH && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع للمورد</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        inputMode="decimal"
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder={totals.grandTotal.toFixed(2)}
                      />
                      <span className="absolute left-3 top-3.5 text-gray-400 text-sm">ر.س</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error for Credit without Supplier */}
              {paymentMethod === PaymentMethod.CREDIT && !selectedSupplier && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  ⚠️ يجب اختيار مورد لإتمام الشراء الآجل
                </div>
              )}

              <button 
                onClick={() => handleCheckout(InvoiceStatus.POSTED)}
                disabled={(paymentMethod === PaymentMethod.CREDIT && !selectedSupplier) || isProcessing}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                حفظ الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

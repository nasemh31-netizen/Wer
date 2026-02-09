
import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Loader2 } from 'lucide-react'; 
import { useSalesStore } from '../../store/useSalesStore';
import { usePOSData } from '../../hooks/usePOSData';
import { useSessionStore } from '../../store/useSessionStore';
import { generateId } from '../../lib/utils';
import { db } from '../../data/db/dexie';
import { InvoiceRepository, CashRepository, ProductRepository, PartnerRepository } from '../../data/repositories/dexieImpl'; 
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod, SyncStatus, PaymentDetail, CashSession, CashSessionStatus, Product, ProductBarcode, Customer, PartnerType } from '../../types';
import { ReceiptGenerator } from '../../services/ReceiptGenerator';

// Components
import { SalesToolbar } from './components/SalesToolbar';
import { SalesTable } from './components/SalesTable';
import { SalesFooter } from './components/SalesFooter';
import { PaymentModal } from './modals/PaymentModal';
import { QuickProductSheet } from './modals/QuickProductSheet';
import { CustomerPickerSheet } from './modals/CustomerPickerSheet';
import { AddCustomerSheet } from './modals/AddCustomerSheet';

export const SalesScreen: React.FC = () => {
  // Global Store
  const { orgId, branchId, userId } = useSessionStore();
  
  // Sales Store
  const { 
    getCurrentCart, getTotals, addToCart, clearCurrentCart, setCustomer
  } = useSalesStore();

  // Data Hook
  const { products, productBarcodes, customers, activeSession } = usePOSData();

  // UI State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  
  const [quickProductTerm, setQuickProductTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("---");

  // Session Opening State
  const [openingAmount, setOpeningAmount] = useState('');
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  // Computed
  const currentCart = getCurrentCart();
  const totals = getTotals();
  const isCartEmpty = currentCart.items.length === 0;

  // Invoice Number Logic
  useEffect(() => {
    const fetchNextNumber = async () => {
      const lastInvoice = await db.invoices.where('org_id').equals(orgId).last();
      if (lastInvoice) {
        // Simple increment logic for demo. Real app needs better locking.
        const lastNum = parseInt(lastInvoice.invoice_number);
        setNextInvoiceNumber(isNaN(lastNum) ? "1001" : (lastNum + 1).toString());
      } else {
        setNextInvoiceNumber("1001");
      }
    };
    fetchNextNumber();
  }, [orgId, isProcessing]);

  // --- ACTIONS ---

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpeningSession(true);
    try {
      const amount = parseFloat(openingAmount);
      if (isNaN(amount)) throw new Error('المبلغ غير صحيح');

      const newSession: CashSession = {
        id: generateId(),
        org_id: orgId,
        user_id: userId || 'unknown',
        status: CashSessionStatus.OPEN,
        opening_amount: amount,
        opened_at: new Date().toISOString(),
        sync_status: SyncStatus.PENDING
      };

      await CashRepository.openSession(newSession);
      setOpeningAmount('');
    } catch (error) {
      console.error(error);
      alert('خطأ في فتح الصندوق');
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleAddProductToCart = (product: Product, qty: number = 1) => {
    addToCart(product, qty);
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleCreateNewProduct = (term: string) => {
    setQuickProductTerm(term);
    setIsQuickProductOpen(true);
  };

  const handleQuickProductSave = async (name: string, price: number) => {
    try {
      const newProduct: Product = {
        id: generateId(),
        org_id: orgId,
        name: name,
        price: price,
        cost: 0, 
        tax_rate: 0.20, 
        min_stock: 0,
        stock: 0, 
        is_active: true,
        is_stock_tracking: true,
        sync_status: SyncStatus.PENDING
      };

      const barcodes: ProductBarcode[] = [];
      if (/^\d{4,}$/.test(quickProductTerm)) {
        barcodes.push({
          id: generateId(),
          org_id: orgId,
          product_id: newProduct.id,
          barcode: quickProductTerm,
          is_primary: true,
          unit_type: 'UNIT',
          factor: 1,
          sync_status: SyncStatus.PENDING
        });
      }

      await ProductRepository.create(newProduct, barcodes);

      addToCart(newProduct, 1);
      setIsQuickProductOpen(false);
      setQuickProductTerm('');

    } catch (error) {
      console.error("Failed to create quick product", error);
      alert("فشل إنشاء المنتج");
    }
  };

  const handleAddNewCustomer = async (name: string, phone: string) => {
    try {
      const newCustomer: Customer = {
        id: generateId(),
        org_id: orgId,
        name: name,
        phone: phone,
        type: PartnerType.CUSTOMER,
        is_active: true,
        balance: 0,
        sync_status: SyncStatus.PENDING
      };

      await PartnerRepository.create(newCustomer);
      
      // Select the new customer immediately
      setCustomer(newCustomer);
      setIsAddCustomerOpen(false);
      setIsCustomerPickerOpen(false); // Also close the picker if open

    } catch (error) {
      console.error(error);
      alert("فشل إضافة العميل");
    }
  };

  const processInvoice = async (status: InvoiceStatus, method: PaymentMethod, paidAmount: number, paymentDetails: PaymentDetail[]) => {
    setIsProcessing(true);
    try {
      const invoiceId = generateId();
      const type = currentCart.type === 'SALE_RETURN' ? 'SALE_RETURN' : 'SALE';

      const invoice: Invoice = {
        id: invoiceId,
        org_id: orgId,
        invoice_number: nextInvoiceNumber,
        type: type,
        partner_id: currentCart.customer?.id,
        warehouse_id: branchId,
        status: status,
        payment_method: method,
        payment_details: paymentDetails, 
        date: new Date().toISOString(),
        subtotal: totals.subtotal,
        tax_total: totals.taxTotal,
        discount_total: totals.totalDiscount,
        grand_total: totals.grandTotal,
        paid_amount: paidAmount,
        created_by: userId || 'unknown',
        sync_status: SyncStatus.PENDING
      };

      const items: InvoiceItem[] = currentCart.items.map(item => {
        const lineTotalRaw = item.price * item.qty;
        const discountAmount = item.discountType === 'FIXED' ? item.discount * item.qty : lineTotalRaw * (item.discount/100);
        const lineTotal = (lineTotalRaw - discountAmount) * (1 + item.taxRate);

        return {
          id: generateId(),
          invoice_id: invoiceId,
          product_id: item.product.id,
          product_name: item.product.name,
          qty: item.qty,
          price: item.price,
          cost: item.product.cost,
          discount: discountAmount, 
          tax_rate: item.taxRate,
          tax_amount: (lineTotalRaw - discountAmount) * item.taxRate,
          total: lineTotal,
          note: item.note
        };
      });

      await InvoiceRepository.create(invoice, items);
      
      ReceiptGenerator.print(invoice, items, undefined, currentCart.customer || undefined);

      try {
        const successAudio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3');
        const playPromise = successAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch (e) {
        console.warn("Audio failed", e);
      }

      clearCurrentCart();
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ الفاتورة.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER: BLOCKING VIEW IF NO SESSION ---
  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6 font-cairo animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={36} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">الوردية مغلقة</h2>
          <p className="text-gray-400 mb-8 text-sm font-medium">ابدأ يومك بفتح الصندوق</p>
          
          <form onSubmit={handleOpenSession} className="space-y-6">
            <div className="text-right">
              <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">الرصيد الافتتاحي (العهدة)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  autoFocus
                  className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-2xl font-black text-gray-800 outline-none transition-all text-center placeholder-gray-300"
                  placeholder="0.00"
                  value={openingAmount}
                  onChange={e => setOpeningAmount(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">DH</span>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isOpeningSession}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200 flex justify-center items-center gap-2"
            >
              {isOpeningSession ? <Loader2 className="animate-spin" /> : "فتح الوردية"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: APPLE-STYLE SALES INTERFACE ---
  return (
    <div className={`flex flex-col h-full font-cairo relative bg-[#f2f2f7] overflow-hidden`}>
      
      {/* 1. Header & Search (Floating) */}
      <div className="flex-none z-30 pt-2 px-3 pb-1">
        <SalesToolbar 
          onAddProduct={handleAddProductToCart}
          onCreateProduct={handleCreateNewProduct}
          onCustomerClick={() => setIsCustomerPickerOpen(true)}
          customers={customers}
          invoiceNumber={nextInvoiceNumber}
          products={products}
          productBarcodes={productBarcodes}
          orgId={orgId}
        />
      </div>

      {/* 2. Scrollable Cart List */}
      <div className="flex-1 overflow-hidden relative">
         <SalesTable />
      </div>

      {/* 3. Bottom Action Bar (Checkout) */}
      <SalesFooter 
        onPaymentClick={() => { if(!isCartEmpty) setIsCheckoutOpen(true); }}
        isCartEmpty={isCartEmpty}
      />

      {/* --- MODALS & SHEETS --- */}
      
      {/* Quick Add Product Sheet */}
      {isQuickProductOpen && (
        <QuickProductSheet
          searchTerm={quickProductTerm}
          onClose={() => setIsQuickProductOpen(false)}
          onSave={handleQuickProductSave}
        />
      )}

      {/* Customer Picker Sheet */}
      {isCustomerPickerOpen && (
        <CustomerPickerSheet
          customers={customers}
          currentCustomer={currentCart.customer}
          onClose={() => setIsCustomerPickerOpen(false)}
          onSelect={(c) => {
            setCustomer(c);
            setIsCustomerPickerOpen(false);
          }}
          onAddNew={() => setIsAddCustomerOpen(true)}
        />
      )}

      {/* Add Customer Sheet */}
      {isAddCustomerOpen && (
        <AddCustomerSheet
          onClose={() => setIsAddCustomerOpen(false)}
          onSave={handleAddNewCustomer}
        />
      )}

      {/* Payment Modal */}
      {isCheckoutOpen && (
        <PaymentModal 
          total={totals.grandTotal}
          customer={currentCart.customer}
          isProcessing={isProcessing}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirm={processInvoice}
        />
      )}
    </div>
  );
};

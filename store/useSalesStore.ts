
import { create } from 'zustand';
import { Product, Customer } from '../types';
import { generateId } from '../lib/utils';

export interface CartItem {
  rowId: string; // Unique ID for the UI row
  product: Product;
  qty: number;
  price: number; // Editable price
  discount: number; // Value of discount
  discountType: 'FIXED' | 'PERCENT';
  taxRate: number;
  note?: string;
  isLastAdded?: boolean; // UI Helper to highlight last scanned
}

interface CartState {
  id: string; // Unique Cart ID
  items: CartItem[];
  customer: Customer | null;
  globalDiscount: number;
  globalDiscountType: 'FIXED' | 'PERCENT';
  type: 'SALE' | 'SALE_RETURN';
  label: string;
  isHeld: boolean; // Is this a suspended transaction?
  heldAt?: string;
}

interface SalesStore {
  // State
  carts: CartState[];
  activeCartIndex: number;
  
  // Actions
  setActiveCartIndex: (index: number) => void;
  createNewCart: () => void;
  removeCart: (index: number) => void;
  
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (rowId: string) => void;
  updateItemQty: (rowId: string, qty: number) => void;
  updateItemPrice: (rowId: string, price: number) => void;
  updateItemDiscount: (rowId: string, discount: number, type: 'FIXED' | 'PERCENT') => void;
  
  setCustomer: (customer: Customer | null) => void;
  setCartType: (type: 'SALE' | 'SALE_RETURN') => void;
  setCartLabel: (label: string) => void;
  setGlobalDiscount: (discount: number, type: 'FIXED' | 'PERCENT') => void;
  
  clearCurrentCart: () => void;
  
  // Computed (Helper)
  getCurrentCart: () => CartState;
  getTotals: () => { 
    subtotal: number; 
    totalDiscount: number;
    netBeforeTax: number;
    taxTotal: number; 
    grandTotal: number; 
    itemCount: number 
  };
}

const createEmptyCart = (idx: number): CartState => ({
  id: generateId(),
  items: [], 
  customer: null,
  globalDiscount: 0,
  globalDiscountType: 'FIXED',
  type: 'SALE',
  label: `فاتورة ${idx + 1}`,
  isHeld: false
});

export const useSalesStore = create<SalesStore>((set, get) => ({
  carts: [createEmptyCart(0)],
  activeCartIndex: 0,

  setActiveCartIndex: (index) => set({ activeCartIndex: index }),

  createNewCart: () => set(state => ({
    carts: [...state.carts, createEmptyCart(state.carts.length)],
    activeCartIndex: state.carts.length // Switch to new cart
  })),

  removeCart: (index) => set(state => {
    if (state.carts.length <= 1) return state; // Don't remove last cart
    const newCarts = state.carts.filter((_, i) => i !== index);
    return {
      carts: newCarts,
      activeCartIndex: Math.min(state.activeCartIndex, newCarts.length - 1)
    };
  }),

  getCurrentCart: () => {
    const { carts, activeCartIndex } = get();
    return carts[activeCartIndex] || carts[0];
  },

  addToCart: (product, qty = 1) => {
    // Audio Feedback with Safe Play
    try {
      const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3'); 
      audio.volume = 0.5;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { /* Ignore play error */ });
      }
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }

    set((state) => {
      const newCarts = [...state.carts];
      const currentCart = newCarts[state.activeCartIndex];
      
      // Remove highlight from all previous items
      const cleanItems = currentCart.items.map(i => ({...i, isLastAdded: false}));

      // Check if exact same product exists (same price)
      const existingIdx = cleanItems.findIndex(i => i.product.id === product.id && i.price === product.price);

      if (existingIdx >= 0) {
        // Update quantity
        cleanItems[existingIdx] = {
          ...cleanItems[existingIdx],
          qty: cleanItems[existingIdx].qty + qty,
          isLastAdded: true // Highlight this
        };
        newCarts[state.activeCartIndex] = { ...currentCart, items: cleanItems };
      } else {
        // Add new row
        const newItem: CartItem = {
          rowId: generateId(),
          product,
          qty: qty,
          price: product.price,
          discount: 0,
          discountType: 'FIXED',
          taxRate: product.tax_rate,
          isLastAdded: true
        };
        newCarts[state.activeCartIndex] = { ...currentCart, items: [...cleanItems, newItem] };
      }
      return { carts: newCarts };
    });
  },

  removeFromCart: (rowId) => {
    set((state) => {
      const newCarts = [...state.carts];
      const currentCart = newCarts[state.activeCartIndex];
      newCarts[state.activeCartIndex] = {
        ...currentCart,
        items: currentCart.items.filter(i => i.rowId !== rowId)
      };
      return { carts: newCarts };
    });
  },

  updateItemQty: (rowId, qty) => {
    set((state) => {
      const newCarts = [...state.carts];
      const currentCart = newCarts[state.activeCartIndex];
      newCarts[state.activeCartIndex] = {
        ...currentCart,
        items: currentCart.items.map(i => i.rowId === rowId ? { ...i, qty } : i)
      };
      return { carts: newCarts };
    });
  },

  updateItemPrice: (rowId, price) => {
    set((state) => {
      const newCarts = [...state.carts];
      const currentCart = newCarts[state.activeCartIndex];
      newCarts[state.activeCartIndex] = {
        ...currentCart,
        items: currentCart.items.map(i => i.rowId === rowId ? { ...i, price } : i)
      };
      return { carts: newCarts };
    });
  },

  updateItemDiscount: (rowId, discount, type) => {
    set((state) => {
      const newCarts = [...state.carts];
      const currentCart = newCarts[state.activeCartIndex];
      newCarts[state.activeCartIndex] = {
        ...currentCart,
        items: currentCart.items.map(i => i.rowId === rowId ? { ...i, discount, discountType: type } : i)
      };
      return { carts: newCarts };
    });
  },

  setCustomer: (customer) => {
    set((state) => {
      const newCarts = [...state.carts];
      newCarts[state.activeCartIndex].customer = customer;
      return { carts: newCarts };
    });
  },

  setCartType: (type) => {
    set((state) => {
      const newCarts = [...state.carts];
      newCarts[state.activeCartIndex].type = type;
      return { carts: newCarts };
    });
  },

  setCartLabel: (label) => {
    set((state) => {
      const newCarts = [...state.carts];
      newCarts[state.activeCartIndex].label = label;
      return { carts: newCarts };
    });
  },

  setGlobalDiscount: (discount, type) => {
    set((state) => {
      const newCarts = [...state.carts];
      newCarts[state.activeCartIndex].globalDiscount = discount;
      newCarts[state.activeCartIndex].globalDiscountType = type;
      return { carts: newCarts };
    });
  },

  clearCurrentCart: () => {
    set((state) => {
      const newCarts = [...state.carts];
      // Reuse the current index but reset content
      newCarts[state.activeCartIndex] = createEmptyCart(state.activeCartIndex);
      return { carts: newCarts };
    });
  },

  getTotals: () => {
    const { carts, activeCartIndex } = get();
    const cart = carts[activeCartIndex] || carts[0];
    
    let subtotal = 0; // Raw total (Price * Qty)
    let totalDiscount = 0; // Sum of line discounts + Global
    let taxTotal = 0;
    let itemCount = 0;
    
    // 1. Calculate items
    cart.items.forEach(item => {
      let lineDiscountAmount = 0;
      if (item.discountType === 'FIXED') {
        lineDiscountAmount = item.discount * item.qty;
      } else {
        lineDiscountAmount = (item.price * item.qty) * (item.discount / 100);
      }
      
      const lineTotalRaw = item.price * item.qty;
      const taxableBase = lineTotalRaw - lineDiscountAmount;
      
      subtotal += lineTotalRaw;
      totalDiscount += lineDiscountAmount;
      
      // Tax calculation (Assumes Price is Exclusive or handled by business logic)
      const taxAmount = Math.max(0, taxableBase) * item.taxRate;
      taxTotal += taxAmount;
      itemCount += item.qty;
    });

    // 2. Global Discount
    let globalDiscountAmount = 0;
    if (cart.globalDiscountType === 'FIXED') {
      globalDiscountAmount = cart.globalDiscount;
    } else {
      globalDiscountAmount = (subtotal - totalDiscount) * (cart.globalDiscount / 100);
    }
    
    totalDiscount += globalDiscountAmount;

    // Adjust Tax for Global Discount (Approximate)
    if (subtotal > 0 && globalDiscountAmount > 0) {
      const discountRatio = globalDiscountAmount / (subtotal - (totalDiscount - globalDiscountAmount));
      taxTotal = taxTotal * (1 - discountRatio);
    }

    const netBeforeTax = subtotal - totalDiscount;
    const grandTotal = netBeforeTax + taxTotal;

    return {
      subtotal,
      totalDiscount,
      netBeforeTax,
      taxTotal,
      grandTotal: Math.max(0, grandTotal),
      itemCount
    };
  }
}));

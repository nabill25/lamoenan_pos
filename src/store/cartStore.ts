import { create } from 'zustand';

// Types
export interface CartItem {
  tempId: string;
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  variant?: { name: string; price: number };
  addons: { name: string; price: number }[];
}

// Interface State yang diperluas untuk Member & Diskon
interface CartState {
  items: CartItem[];
  discount: number; // Persentase diskon (0 - 100)
  selectedMember: any | null; // Data member dari database
  addToCart: (item: Omit<CartItem, 'tempId'>) => void;
  removeFromCart: (tempId: string) => void;
  updateQuantity: (tempId: string, quantity: number) => void;
  setDiscount: (value: number) => void;
  setMember: (member: any | null) => void;
  clearCart: () => void;
  getTotals: () => {
    subtotal: number;
    discountAmount: number;
    tax: number;
    total: number
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  selectedMember: null,

  addToCart: (newItem) => set((state) => {
    const tempId = crypto.randomUUID();
    return { items: [...state.items, { ...newItem, tempId }] };
  }),

  removeFromCart: (tempId) => set((state) => ({
    items: state.items.filter((i) => i.tempId !== tempId)
  })),

  updateQuantity: (tempId, qty) => set((state) => ({
    items: state.items.map((i) => i.tempId === tempId ? { ...i, quantity: qty } : i)
  })),

  // Fungsi baru untuk mengatur diskon & member
  setDiscount: (value) => set({ discount: value }),
  setMember: (member) => set({ selectedMember: member }),

  clearCart: () => set({
    items: [],
    discount: 0,
    selectedMember: null
  }),

  getTotals: () => {
    const { items, discount } = get();

    // 1. Hitung Subtotal (Harga asli + varian + addons)
    const subtotal = items.reduce((sum, item) => {
      let itemPrice = item.price;
      if (item.variant) itemPrice += item.variant.price;
      item.addons.forEach(addon => itemPrice += addon.price);
      return sum + (itemPrice * item.quantity);
    }, 0);

    // 2. Hitung Nominal Diskon (Berdasarkan persentase dari subtotal)
    const discountAmount = (subtotal * discount) / 100;

    // 3. Harga setelah diskon (Dasar pengenaan pajak)
    const afterDiscount = subtotal - discountAmount;

    // 4. Pajak 11% dari harga setelah diskon
    const tax = afterDiscount * 0.11;

    return {
      subtotal,
      discountAmount,
      tax,
      total: afterDiscount + tax
    };
  }
}));
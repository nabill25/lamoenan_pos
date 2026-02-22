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

interface CartState {
  items: CartItem[];
  discount: number; // For percentage or fixed value
  discountType: 'percentage' | 'fixed';
  taxRate: number; // e.g. 0.11 for 11%
  serviceChargeRate: number; // e.g. 0.05 for 5%
  promoCode: string | null;
  redeemPoints: number; // Jumlah poin yang akan ditukar (1 poin = Rp1 misal)
  selectedMember: any | null; // Data member dari database
  addToCart: (item: Omit<CartItem, 'tempId'>) => void;
  removeFromCart: (tempId: string) => void;
  updateQuantity: (tempId: string, quantity: number) => void;
  setDiscount: (value: number, type?: 'percentage' | 'fixed') => void;
  setPromoCode: (code: string | null) => void;
  setRedeemPoints: (points: number) => void;
  setStoreSettings: (taxRate: number, serviceChargeRate: number) => void;
  setMember: (member: any | null) => void;
  clearCart: () => void;
  getTotals: () => {
    subtotal: number;
    discountAmount: number;
    pointsDiscount: number;
    serviceChargeAmount: number;
    taxAmount: number;
    total: number
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  discountType: 'percentage',
  taxRate: 0.11, // default 11%
  serviceChargeRate: 0, // default 0%
  promoCode: null,
  redeemPoints: 0,
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
  setDiscount: (value, type = 'percentage') => set({ discount: value, discountType: type }),
  setPromoCode: (code) => set({ promoCode: code }),
  setRedeemPoints: (points) => set({ redeemPoints: points }),
  setStoreSettings: (tax, sc) => set({ taxRate: tax, serviceChargeRate: sc }),
  setMember: (member) => set({ selectedMember: member }),

  clearCart: () => set({
    items: [],
    discount: 0,
    discountType: 'percentage',
    taxRate: 0.11,
    serviceChargeRate: 0,
    promoCode: null,
    redeemPoints: 0,
    selectedMember: null
  }),

  getTotals: () => {
    const { items } = get();

    // 1. Hitung Subtotal (Harga asli + varian + addons)
    const subtotal = items.reduce((sum, item) => {
      let itemPrice = item.price;
      if (item.variant) itemPrice += item.variant.price;
      item.addons.forEach(addon => itemPrice += addon.price);
      return sum + (itemPrice * item.quantity);
    }, 0);

    // 2. Hitung Nominal Diskon (Persentase atau Fixed)
    let discountAmount = 0;
    if (get().discountType === 'percentage') {
      const calcDiscount = (subtotal * get().discount) / 100;
      // We don't have max logic in this simple function yet, but can be added later
      discountAmount = calcDiscount;
    } else {
      discountAmount = get().discount;
    }

    // Ensure discount amount doesn't exceed subtotal
    if (discountAmount > subtotal) discountAmount = subtotal;

    // 2.5 Hitung Diskon Poin (1 poin = Rp1)
    let pointsDiscount = get().redeemPoints;
    if (pointsDiscount > (subtotal - discountAmount)) {
      // Maksimal poin yang bisa diredeem tidak boleh melebihi sisa tagihan
      pointsDiscount = subtotal - discountAmount;
    }

    //  Harga setelah diskon (Dasar pengenaan SC & Pajak)
    const afterDiscount = subtotal - discountAmount - pointsDiscount;

    //  Hitung Service Charge
    const serviceChargeAmount = afterDiscount * get().serviceChargeRate;

    //  Hitung Pajak (Berdasarkan Subtotal - Diskon - Promo + Service Charge)
    const dasarPengenaanPajak = afterDiscount + serviceChargeAmount;
    const taxAmount = dasarPengenaanPajak * get().taxRate;

    return {
      subtotal,
      discountAmount,
      pointsDiscount,
      serviceChargeAmount,
      taxAmount,
      total: afterDiscount + serviceChargeAmount + taxAmount
    };
  }
}));
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Shift {
    id: string;
    cashier_id?: string;
    cashier_name?: string;
    opening_cash: number;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at?: string;
    total_sales?: number;
    total_orders?: number;
}

interface ShiftState {
    activeShift: Shift | null;
    setActiveShift: (shift: Shift | null) => void;
}

export const useShiftStore = create<ShiftState>()(
    persist(
        (set) => ({
            activeShift: null,
            setActiveShift: (shift) => set({ activeShift: shift }),
        }),
        { name: 'lamoenan-shift' }
    )
);

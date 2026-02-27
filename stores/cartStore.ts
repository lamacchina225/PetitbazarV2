import { create } from 'zustand';

interface CartState {
  count: number;
  setCount: (n: number) => void;
  inc: (delta?: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
  inc: (delta = 1) => set((s) => ({ count: s.count + delta })),
}));

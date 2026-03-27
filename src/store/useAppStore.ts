import { create } from 'zustand';
import type { Alumno, PedidoItem } from '../types';

interface AppState {
  currentAlumno: Alumno | null;
  setCurrentAlumno: (alumno: Alumno | null) => void;
  
  cart: PedidoItem[];
  addToCart: (item: Omit<PedidoItem, 'id'>) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentAlumno: null,
  setCurrentAlumno: (alumno) => set({ currentAlumno: alumno }), 
  
  cart: [],
  addToCart: (item) => {
    set((state) => {
      const existingItemIndex = state.cart.findIndex(i => i.productoId === item.productoId);
      if (existingItemIndex >= 0) {
        // Increment amount
        const newCart = [...state.cart];
        newCart[existingItemIndex].cantidad += item.cantidad;
        return { cart: newCart };
      }
      return { cart: [...state.cart, { ...item, id: crypto.randomUUID() }] };
    });
  },
  removeFromCart: (index) => set((state) => ({ 
    cart: state.cart.filter((_, i) => i !== index) 
  })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((total, item) => total + (item.precioUnitario * item.cantidad), 0)
}));

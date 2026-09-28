import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';
import { trackAddToCart, trackPurchase } from '../utils/metaPixel';

type CartLineItem = {
  id: string;
  product: Product;
  color?: string;
  size?: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartLineItem[];
  isOpen: boolean;
};

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; color?: string; size?: string; price: number; quantity: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'LOAD_CART'; items: CartLineItem[] };

const CART_KEY = 'ml_cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIdx = state.items.findIndex(
        i => i.product.id === action.product.id && i.color === action.color && i.size === action.size
      );
      if (existingIdx > -1) {
        const updated = [...state.items];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + action.quantity,
          price: action.price, // always refresh price to match the latest add
        };
        return { ...state, items: updated, isOpen: true };
      }
      const newItem: CartLineItem = {
        id: `${action.product.id}-${action.color ?? ''}-${action.size ?? ''}-${Date.now()}`,
        product: action.product,
        color: action.color,
        size: action.size,
        price: action.price,
        quantity: action.quantity,
      };
      return { ...state, items: [...state.items, newItem], isOpen: true };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY': {
      if (action.quantity < 1) return { ...state, items: state.items.filter(i => i.id !== action.id) };
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, quantity: action.quantity } : i) };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'LOAD_CART':
      return { ...state, items: action.items };
    default:
      return state;
  }
}

// ── Bundle pricing helper ─────────────────────────────────────
// Applies the 100ml bundle deal:
//   qty 1 → $15
//   qty 2 → $25
//   qty 3 → $35
// For qty 4+ the offer is removed and normal price × qty applies.
function getLineTotal(item: CartLineItem): number {
  const is100ml = item.size?.toLowerCase().includes('100ml') ?? false;

  if (is100ml) {
    if (item.quantity === 1) return 15;
    if (item.quantity === 2) return 25;
    if (item.quantity === 3) return 35;
    // qty 4+ → normal price × qty (bundle removed)
    return item.price * item.quantity;
  }

  return item.price * item.quantity;
}
// ──────────────────────────────────────────────────────────────

type CartContextType = CartState & {
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, color: string | undefined, size: string | undefined, price: number, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: (userId: string, shippingAddress: any) => Promise<any>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) dispatch({ type: 'LOAD_CART', items: JSON.parse(stored) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);

  // ── Subtotal now uses bundle-aware line totals ───────────────
  const subtotal = state.items.reduce((sum, i) => sum + getLineTotal(i), 0);
  // ─────────────────────────────────────────────────────────────

  const createOrder = async (userId: string, shippingAddress: any) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_amount: subtotal,
          status: 'pending',
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // ── Save order items with bundle-aware line prices ───────
      const orderItems = state.items.map((item) => {
        const lineTotal = getLineTotal(item);
        // Per-unit price reflecting the deal (so lineTotal = unitPrice * qty)
        const effectiveUnitPrice = item.quantity > 0 ? lineTotal / item.quantity : item.price;
        return {
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: effectiveUnitPrice,
        };
      });
      // ─────────────────────────────────────────────────────────

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // ── Meta Pixel: Purchase ──────────────────────────────────
      // Fire only after the order is confirmed in Supabase,
      // and BEFORE we clear the cart (we need the items).
      trackPurchase(
        subtotal,
        state.items.map((i) => ({ id: i.product.id }))
      );
      // ──────────────────────────────────────────────────────────

      dispatch({ type: 'CLEAR_CART' });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{
      ...state,
      dispatch,
      totalItems,
      subtotal,
      addItem: (product, color, size, price, quantity = 1) => {
        dispatch({ type: 'ADD_ITEM', product, color, size, price, quantity });

        // ── Meta Pixel: AddToCart ───────────────────────────────
        trackAddToCart(
          { id: product.id, name: product.name, price },
          quantity
        );
        // ────────────────────────────────────────────────────────
      },
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', id }),
      updateQty: (id, quantity) => dispatch({ type: 'UPDATE_QTY', id, quantity }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      createOrder,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
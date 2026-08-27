import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { WishlistItem } from '../types';

type WishlistContextType = {
  items: WishlistItem[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { setItems([]); return; }
    setLoading(true);
    supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', authUser.id)
      .then(({ data }) => {
        setItems((data as WishlistItem[]) ?? []);
        setLoading(false);
      });
  }, [authUser]);

  const isInWishlist = (productId: string) => items.some(i => i.product_id === productId);

  const toggleWishlist = async (productId: string) => {
    if (!authUser) return;
    if (isInWishlist(productId)) {
      await supabase.from('wishlist').delete().eq('user_id', authUser.id).eq('product_id', productId);
      setItems(prev => prev.filter(i => i.product_id !== productId));
    } else {
      const { data } = await supabase
        .from('wishlist')
        .insert({ user_id: authUser.id, product_id: productId })
        .select('*, products(*)')
        .single();
      if (data) setItems(prev => [...prev, data as WishlistItem]);
    }
  };

  return (
    <WishlistContext.Provider value={{ items, loading, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

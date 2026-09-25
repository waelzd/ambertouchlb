import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: 'customer' | 'admin';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image_url: string | null;
          description: string | null;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          sale_price: number | null;
          stock_quantity: number;
          category_id: string | null;
          featured: boolean;
          best_seller: boolean;
          new_arrival: boolean;
          image_urls: string[];
          tags: string[];
          created_at: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          color: string | null;
          size: string | null;
          stock: number;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          total_amount: number;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          payment_status: 'unpaid' | 'paid' | 'refunded';
          shipping_address: Record<string, string> | null;
          notes: string | null;
          created_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          quantity: number;
          price: number;
          created_at: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          is_default: boolean;
          created_at: string;
        };
      };
      newsletter_subscriptions: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
        };
      };
      banners: {
        Row: {
          id: string;
          title: string | null;
          subtitle: string | null;
          image_url: string | null;
          link: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
      };
    };
  };
};

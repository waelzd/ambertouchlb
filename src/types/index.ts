// types.ts
export interface User {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  phone: string | null;
  role: 'customer' | 'admin';
  has_used_signup_discount: boolean;
  avatar_url?: string | null;
  email_verified: boolean;
  verified_at?: string;
  verification_code?: string;
  verification_expiry?: string;
  created_at?: string;
  updated_at?: string;
}

// For registration
export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

// For login
export interface LoginData {
  email: string;
  password: string;
}

export interface ProductSize {
  label: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  icon: string | null;
  color_hex: string | null;
  parent_category_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface Banner {
  link: string;
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  mobile_image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  button_color: string | null;
  position: 'hero' | 'sidebar' | 'footer' | 'featured';
  type: 'promotion' | 'new_arrival' | 'seasonal' | 'brand' | 'sale';
  display_order: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  background_color: string | null;
  text_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code?: string;
  country: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  code: number;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  category_id: string | null;
  image_urls: string[];
  sizes: ProductSize[] | null;
  created_at: Date;
  updated_at: Date;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string | null;
  products?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: string;
  total_amount: number;
  discount_amount: number;
  shipping_address: ShippingAddress;
  order_items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  products?: Product; // Optional: populated when fetching with product details
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
}
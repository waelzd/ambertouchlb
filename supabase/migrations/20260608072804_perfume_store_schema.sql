-- ============================================
-- USERS PROFILE TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_user" ON public.users FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_user" ON public.users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_user" ON public.users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_user" ON public.users FOR DELETE
  TO authenticated USING (auth.uid() = id);


-- Admin can read all users
CREATE POLICY "admin_select_users" ON public.users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- CATEGORIES (Perfume families)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  description TEXT,
  icon TEXT,
  color_hex TEXT,
  parent_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_categories" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "update_categories" ON public.categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "delete_categories" ON public.categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- PRODUCTS (Perfumes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT false,
  best_seller BOOLEAN DEFAULT false,
  new_arrival BOOLEAN DEFAULT false,
  gender TEXT DEFAULT 'unisex' CHECK (gender IN ('men', 'women', 'unisex')),
  fragrance_notes JSONB,
  image_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  launch_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_products" ON public.products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "update_products" ON public.products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "delete_products" ON public.products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- PRODUCT VARIANTS (Sizes/Volumes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  volume_ml INTEGER,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_variants" ON public.product_variants FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "update_variants" ON public.product_variants FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "delete_variants" ON public.product_variants FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- ADDRESSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_addresses" ON public.addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_addresses" ON public.addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_addresses" ON public.addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_addresses" ON public.addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('card', 'paypal', 'bank_transfer', 'cash')),
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_orders" ON public.orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_orders" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_select_orders" ON public.orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "admin_update_orders" ON public.orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_order_items" ON public.order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "admin_select_order_items" ON public.order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- WISHLIST
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_wishlist" ON public.wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_wishlist" ON public.wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_wishlist" ON public.wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image_urls TEXT[] DEFAULT '{}',
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_own_reviews" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reviews" ON public.reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reviews" ON public.reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- CART ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_cart" ON public.cart_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_cart" ON public.cart_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_cart" ON public.cart_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_cart" ON public.cart_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- NEWSLETTER SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_newsletter" ON public.newsletter_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "select_newsletter_admin" ON public.newsletter_subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- BANNERS (Homepage banners with scheduling)
-- ============================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  button_text TEXT,
  button_link TEXT,
  button_color TEXT DEFAULT 'gold',
  position TEXT DEFAULT 'hero' CHECK (position IN ('hero', 'sidebar', 'footer', 'featured')),
  type TEXT DEFAULT 'promotion' CHECK (type IN ('promotion', 'new_arrival', 'seasonal', 'brand', 'sale')),
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  background_color TEXT,
  text_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_active_banners" ON public.banners FOR SELECT TO anon, authenticated USING (
  active = true AND 
  (start_date IS NULL OR start_date <= NOW()) AND 
  (end_date IS NULL OR end_date >= NOW())
);
CREATE POLICY "admin_insert_banners" ON public.banners FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "admin_update_banners" ON public.banners FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "admin_delete_banners" ON public.banners FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );


-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Generate order number
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(EXTRACT(EPOCH FROM NOW()) AS TEXT), 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Categories (Perfume Families)
-- ============================================
INSERT INTO public.categories (name, slug, image_url, description, icon, color_hex, sort_order) 
SELECT * FROM (VALUES
  ('Floral', 'floral', 'https://images.pexels.com/photos/1287072/pexels-photo-1287072.jpeg', 'Delicate, romantic, and feminine floral fragrances', 'fa-seedling', '#FFB6C1', 1),
  ('Woody', 'woody', 'https://images.pexels.com/photos/3667911/pexels-photo-3667911.jpeg', 'Warm, sophisticated, and earthy woody scents', 'fa-tree', '#8B7355', 2),
  ('Oriental', 'oriental', 'https://images.pexels.com/photos/1306244/pexels-photo-1306244.jpeg', 'Exotic, sensual, and warm oriental perfumes', 'fa-moon', '#D4A574', 3),
  ('Fresh', 'fresh', 'https://images.pexels.com/photos/1287072/pexels-photo-1287072.jpeg', 'Clean, invigorating, and aquatic fresh scents', 'fa-water', '#87CEEB', 4),
  ('Citrus', 'citrus', 'https://images.pexels.com/photos/173633/pexels-photo-173633.jpeg', 'Zesty, vibrant, and energizing citrus notes', 'fa-lemon', '#FFD700', 5),
  ('Gourmand', 'gourmand', 'https://images.pexels.com/photos/6473085/pexels-photo-6473085.jpeg', 'Sweet, edible, and delicious gourmand fragrances', 'fa-cookie', '#D2691E', 6),
  ('Chypre', 'chypre', 'https://images.pexels.com/photos/1306244/pexels-photo-1306244.jpeg', 'Classic, earthy, and sophisticated chypre compositions', 'fa-leaf', '#556B2F', 7),
  ('Fougere', 'fougere', 'https://images.pexels.com/photos/3667911/pexels-photo-3667911.jpeg', 'Aromatic, herbal, and masculine fougere scents', 'fa-mountain', '#2F4F4F', 8)
) AS v(name, slug, image_url, description, icon, color_hex, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = v.slug);

-- ============================================
-- SEED DATA: Fragrance Notes
-- ============================================
INSERT INTO public.fragrance_notes (name, slug, type, description) 
SELECT * FROM (VALUES
  ('Bergamot', 'bergamot', 'top', 'Fresh, citrusy, and bright Italian bergamot'),
  ('Lemon', 'lemon', 'top', 'Zesty and uplifting lemon'),
  ('Orange Blossom', 'orange-blossom', 'top', 'Sweet and intoxicating orange blossom'),
  ('Lavender', 'lavender', 'top', 'Calming and aromatic lavender'),
  ('Peppermint', 'peppermint', 'top', 'Fresh and cooling mint'),
  ('Rose', 'rose', 'heart', 'Classic, romantic, and lush rose'),
  ('Jasmine', 'jasmine', 'heart', 'Rich, sensual, and exotic jasmine'),
  ('Ylang Ylang', 'ylang-ylang', 'heart', 'Sweet and floral ylang ylang'),
  ('Iris', 'iris', 'heart', 'Powdery and elegant iris'),
  ('Patchouli', 'patchouli', 'heart', 'Earthy and rich patchouli'),
  ('Vanilla', 'vanilla', 'base', 'Warm and sweet vanilla'),
  ('Sandalwood', 'sandalwood', 'base', 'Creamy and woody sandalwood'),
  ('Musk', 'musk', 'base', 'Warm and sensual musk'),
  ('Amber', 'amber', 'base', 'Resinous and golden amber'),
  ('Oud', 'oud', 'base', 'Rich and complex agarwood')
) AS v(name, slug, type, description)
WHERE NOT EXISTS (SELECT 1 FROM public.fragrance_notes WHERE slug = v.slug);

-- ============================================
-- SEED DATA: Products (Luxury Perfumes)
-- ============================================
DO $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'oriental';
  IF cat_id IS NOT NULL THEN
    INSERT INTO public.products (name, slug, brand, description, price, sale_price, stock_quantity, category_id, featured, best_seller, new_arrival, gender, image_urls, fragrance_notes, rating, reviews_count, launch_year)
    VALUES (
      'Noir de Luxe',
      'noir-de-luxe',
      'Maison Noir',
      'A sophisticated blend of black oud, rose, and saffron. This luxurious fragrance opens with a burst of spicy saffron, revealing a heart of velvety rose and rich amber, settling into a warm base of oud and vanilla.',
      395.00,
      350.00,
      25,
      cat_id,
      true,
      true,
      false,
      'unisex',
      ARRAY['https://images.pexels.com/photos/1306244/pexels-photo-1306244.jpeg', 'https://images.pexels.com/photos/3667911/pexels-photo-3667911.jpeg'],
      '{"top": ["Saffron", "Bergamot"], "heart": ["Rose", "Amber"], "base": ["Oud", "Vanilla"]}',
      4.8,
      124,
      2023
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'floral';
  IF cat_id IS NOT NULL THEN
    INSERT INTO public.products (name, slug, brand, description, price, sale_price, stock_quantity, category_id, featured, best_seller, new_arrival, gender, image_urls, fragrance_notes, rating, reviews_count, launch_year)
    VALUES (
      'Fleur Éternelle',
      'fleur-eternelle',
      'Château de Parfum',
      'An eternal floral masterpiece with Bulgarian rose, jasmine sambac, and iris. A delicate yet powerful fragrance that evolves throughout the day, leaving an unforgettable trail of sophistication.',
      285.00,
      NULL,
      30,
      cat_id,
      true,
      true,
      true,
      'women',
      ARRAY['https://images.pexels.com/photos/1287072/pexels-photo-1287072.jpeg', 'https://images.pexels.com/photos/173633/pexels-photo-173633.jpeg'],
      '{"top": ["Orange Blossom", "Bergamot"], "heart": ["Rose", "Jasmine", "Iris"], "base": ["Musk", "Sandalwood"]}',
      4.9,
      87,
      2024
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'woody';
  IF cat_id IS NOT NULL THEN
    INSERT INTO public.products (name, slug, brand, description, price, sale_price, stock_quantity, category_id, featured, best_seller, new_arrival, gender, image_urls, fragrance_notes, rating, reviews_count, launch_year)
    VALUES (
      'Santal Royal',
      'santal-royal',
      'Royal Oud',
      'A majestic woody fragrance featuring the finest Mysore sandalwood and rare agarwood. A warm, creamy, and sophisticated scent for those who appreciate the art of perfumery.',
      425.00,
      399.00,
      15,
      cat_id,
      false,
      true,
      false,
      'men',
      ARRAY['https://images.pexels.com/photos/3667911/pexels-photo-3667911.jpeg', 'https://images.pexels.com/photos/1306244/pexels-photo-1306244.jpeg'],
      '{"top": ["Lavender", "Peppermint"], "heart": ["Patchouli", "Iris"], "base": ["Sandalwood", "Oud", "Amber"]}',
      4.7,
      56,
      2022
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'citrus';
  IF cat_id IS NOT NULL THEN
    INSERT INTO public.products (name, slug, brand, description, price, sale_price, stock_quantity, category_id, featured, best_seller, new_arrival, gender, image_urls, fragrance_notes, rating, reviews_count, launch_year)
    VALUES (
      'Citrus Délice',
      'citrus-delice',
      'Méditerranée',
      'A vibrant and energizing citrus symphony with Italian lemon, bergamot, and verbena. The perfect summer fragrance that captures the essence of the Mediterranean coastline.',
      195.00,
      165.00,
      40,
      cat_id,
      false,
      false,
      true,
      'unisex',
      ARRAY['https://images.pexels.com/photos/173633/pexels-photo-173633.jpeg', 'https://images.pexels.com/photos/1287072/pexels-photo-1287072.jpeg'],
      '{"top": ["Lemon", "Bergamot", "Verbena"], "heart": ["Lavender", "Rose"], "base": ["Musk", "Amber"]}',
      4.5,
      34,
      2024
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'gourmand';
  IF cat_id IS NOT NULL THEN
    INSERT INTO public.products (name, slug, brand, description, price, sale_price, stock_quantity, category_id, featured, best_seller, new_arrival, gender, image_urls, fragrance_notes, rating, reviews_count, launch_year)
    VALUES (
      'Vanilla Nectar',
      'vanilla-nectar',
      'Gourmand Secrets',
      'A decadent gourmand fragrance with Madagascar vanilla, tonka bean, and caramel. Sweet, warm, and irresistibly comforting - like a luxurious dessert in a bottle.',
      245.00,
      220.00,
      20,
      cat_id,
      true,
      true,
      false,
      'women',
      ARRAY['https://images.pexels.com/photos/6473085/pexels-photo-6473085.jpeg', 'https://images.pexels.com/photos/1306244/pexels-photo-1306244.jpeg'],
      '{"top": ["Bergamot", "Lemon"], "heart": ["Jasmine", "Ylang Ylang"], "base": ["Vanilla", "Caramel", "Tonka Bean"]}',
      4.6,
      78,
      2023
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;

  SELECT id INTO cat_id FROM public.categories WHERE slug = 'fougere';
  IF cat_id IS NOT NULL THEN
    INSERT INTO public.products (name, slug, brand, description, price, sale_price, stock_quantity, category_id, featured, best_seller, new_arrival, gender, image_urls, fragrance_notes, rating, reviews_count, launch_year)
    VALUES (
      'Fougère Mystique',
      'fougere-mystique',
      'Aromatic Perfume House',
      'A classic fougère composition reimagined with modern elegance. Lavender, oakmoss, and coumarin combine to create an aromatic and deeply masculine fragrance.',
      275.00,
      NULL,
      18,
      cat_id,
      false,
      true,
      true,
      'men',
      ARRAY['https://images.pexels.com/photos/3667911/pexels-photo-3667911.jpeg', 'https://images.pexels.com/photos/1287072/pexels-photo-1287072.jpeg'],
      '{"top": ["Lavender", "Bergamot"], "heart": ["Patchouli", "Iris"], "base": ["Oakmoss", "Coumarin", "Musk"]}',
      4.8,
      45,
      2024
    ) ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- SEED DATA: Product Variants (Sizes)
-- ============================================
DO $$
DECLARE
  prod_record RECORD;
BEGIN
  FOR prod_record IN SELECT id, slug, price FROM public.products LOOP
    -- 30ml variant
    INSERT INTO public.product_variants (product_id, size, volume_ml, price, stock, sku)
    VALUES (
      prod_record.id,
      '30ml',
      30,
      prod_record.price * 0.6,
      FLOOR(RANDOM() * 20 + 5)::INT,
      prod_record.slug || '-30ml'
    ) ON CONFLICT (sku) DO NOTHING;

    -- 50ml variant
    INSERT INTO public.product_variants (product_id, size, volume_ml, price, stock, sku)
    VALUES (
      prod_record.id,
      '50ml',
      50,
      prod_record.price,
      FLOOR(RANDOM() * 30 + 10)::INT,
      prod_record.slug || '-50ml'
    ) ON CONFLICT (sku) DO NOTHING;

    -- 100ml variant
    INSERT INTO public.product_variants (product_id, size, volume_ml, price, stock, sku)
    VALUES (
      prod_record.id,
      '100ml',
      100,
      prod_record.price * 1.6,
      FLOOR(RANDOM() * 20 + 5)::INT,
      prod_record.slug || '-100ml'
    ) ON CONFLICT (sku) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- SEED DATA: Banners (Luxury Perfume Campaigns)
-- ============================================
INSERT INTO public.banners (title, subtitle, description, image_url, mobile_image_url, button_text, button_link, button_color, position, type, display_order, active, background_color, text_color) 
SELECT * FROM (VALUES
  (
    'Luxury Perfume Collection',
    'Discover Your Signature Scent',
    'Experience the finest artisan perfumes crafted with rare and exotic ingredients. From timeless florals to deep, sensual ouds.',
    'https://images.pexels.com/photos/1306244/pexels-photo-1306244.jpeg',
    NULL,
    'Explore Collection',
    '/shop',
    'gold',
    'hero',
    'promotion',
    1,
    true,
    '#0a0a0a',
    '#FFFFFF'
  ),
  (
    'New Arrivals 2024',
    'Spring/Summer Collection',
    'Fresh, vibrant, and utterly captivating - our new arrivals are here to elevate your fragrance wardrobe.',
    'https://images.pexels.com/photos/1287072/pexels-photo-1287072.jpeg',
    NULL,
    'Shop New',
    '/shop?new_arrival=true',
    'gold',
    'hero',
    'new_arrival',
    2,
    true,
    '#1a1a2e',
    '#FFD700'
  ),
  (
    'Best Sellers',
    'Loved by Thousands',
    'Our most beloved fragrances that have captured hearts around the world. From iconic classics to modern masterpieces.',
    'https://images.pexels.com/photos/3667911/pexels-photo-3667911.jpeg',
    NULL,
    'View Best Sellers',
    '/shop?best_seller=true',
    'white',
    'featured',
    'brand',
    3,
    true,
    '#2d1b0e',
    '#FFFFFF'
  ),
  (
    'Gift Sets',
    'The Perfect Gift',
    'Elegantly packaged fragrance gift sets for every occasion. Luxurious, thoughtful, and unforgettable.',
    'https://images.pexels.com/photos/6473085/pexels-photo-6473085.jpeg',
    NULL,
    'Shop Gift Sets',
    '/shop?category=gourmand',
    'gold',
    'sidebar',
    'promotion',
    4,
    true,
    '#0d0d0d',
    '#FFD700'
  )
) AS v(title, subtitle, description, image_url, mobile_image_url, button_text, button_link, button_color, position, type, display_order, active, background_color, text_color)
WHERE NOT EXISTS (SELECT 1 FROM public.banners WHERE title = v.title);

-- ============================================
-- VIEW: Product with average rating
-- ============================================
CREATE OR REPLACE VIEW public.product_with_rating AS
SELECT 
  p.*,
  COALESCE(AVG(r.rating), 0) AS avg_rating,
  COUNT(r.id) AS total_reviews
FROM public.products p
LEFT JOIN public.reviews r ON p.id = r.product_id
GROUP BY p.id;

-- ============================================
-- INDEXES for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON public.products(best_seller) WHERE best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON public.products(new_arrival) WHERE new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(active) WHERE active = true;
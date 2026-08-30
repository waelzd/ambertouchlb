import { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight, ZoomIn, X, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, ProductSize } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../pages/ProductPage';

function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const { data } = supabase.storage.from('images').getPublicUrl(url);
  return data.publicUrl;
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { authUser } = useAuth();
  const inWishlist = product ? isInWishlist(product.id) : false;

  const sizes: ProductSize[] = product?.sizes ?? [];

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the product with categories through the junction table
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            categories!product_categories (
              id,
              name,
              slug,
              description,
              image_url,
              created_at,
              updated_at
            )
          `)
          .eq('slug', slug)
          .maybeSingle();

        if (productError) {
          console.error('Product fetch error:', productError);
          setError('Failed to load product');
          setLoading(false);
          return;
        }

        if (!productData) {
          console.log('Product not found');
          setProduct(null);
          setLoading(false);
          return;
        }

        console.log('Product fetched:', productData);
        setProduct(productData as Product);

        // Set selected size if available
        const prodSizes: ProductSize[] = (productData as Product).sizes ?? [];
        setSelectedSize(prodSizes.length > 0 ? prodSizes[0] : null);

        // Fetch related products
        if (productData.id) {
          // First, get category IDs for this product
          const { data: categoryData, error: categoryError } = await supabase
            .from('product_categories')
            .select('category_id')
            .eq('product_id', productData.id);

          if (categoryError) {
            console.error('Error fetching product categories:', categoryError);
            setRelatedProducts([]);
            setLoading(false);
            return;
          }

          const categoryIds = categoryData?.map(pc => pc.category_id) || [];

          if (categoryIds.length === 0) {
            setRelatedProducts([]);
            setLoading(false);
            return;
          }

          // Get product IDs from the same categories (excluding current product)
          const { data: productCategoryData, error: pcError } = await supabase
            .from('product_categories')
            .select('product_id')
            .in('category_id', categoryIds);

          if (pcError) {
            console.error('Error fetching related product IDs:', pcError);
            setRelatedProducts([]);
            setLoading(false);
            return;
          }

          const productIds = productCategoryData
            ?.map(pc => pc.product_id)
            .filter(id => id !== productData.id)
            .slice(0, 4) || [];

          if (productIds.length === 0) {
            setRelatedProducts([]);
            setLoading(false);
            return;
          }

          // Fetch the related products with categories
          const { data: relatedData, error: relatedError } = await supabase
            .from('products')
            .select(`
              *,
              categories!product_categories (
                id,
                name,
                slug,
                description,
                image_url,
                created_at,
                updated_at
              )
            `)
            .in('id', productIds)
            .limit(4);

          if (relatedError) {
            console.error('Related products error:', relatedError);
            setRelatedProducts([]);
          } else {
            console.log('Related products fetched:', relatedData);
            setRelatedProducts((relatedData as Product[]) ?? []);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const unitPrice = selectedSize
    ? selectedSize.price
    : product
    ? (product.sale_price ?? product.price)
    : 0;
  const displayPrice = unitPrice * quantity;
  const images: string[] = product ? (product.image_urls?.map(resolveImageUrl) ?? []) : [];
  const hasDiscount = product?.sale_price !== null && product?.sale_price !== undefined;
  const discountPercentage = hasDiscount && product?.price 
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    addItem(product, undefined, selectedSize?.label ?? undefined, unitPrice, quantity);
    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }, 400);
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Check out this product',
      text: product?.description || '',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard failed:', clipboardError);
        }
      }
    }
  };

  if (!slug) {
    return <Navigate to="/shop" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-serif text-3xl text-white/60 mb-4">Error loading product</p>
          <p className="text-sm text-neutral-500 mb-6">{error}</p>
          <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-full font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300">
            Back to Shop
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen pt-28 px-4 max-w-screen-xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 animate-pulse">
        <div className="aspect-[3/4] bg-neutral-800/50 rounded-2xl" />
        <div className="space-y-4 pt-4">
          <div className="h-3 bg-neutral-800/50 rounded w-1/4" />
          <div className="h-8 bg-neutral-800/50 rounded w-3/4" />
          <div className="h-6 bg-neutral-800/50 rounded w-1/4" />
          <div className="h-px bg-neutral-800/50 my-6" />
          <div className="h-3 bg-neutral-800/50 rounded w-full" />
          <div className="h-3 bg-neutral-800/50 rounded w-3/4" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen pt-28 flex items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-serif text-3xl text-white/60 mb-4">Product not found</p>
        <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-full font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300">
          Back to Shop
        </Link>
      </motion.div>
    </div>
  );

  const categories = (product as any).categories;
  const categoryArray = Array.isArray(categories) ? categories : categories ? [categories] : [];
  const primaryCategory = categoryArray.length > 0 ? categoryArray[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Breadcrumb */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Link to="/" className="hover:text-gold-400 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold-400 transition-colors">Shop</Link>
          {primaryCategory && (
            <>
              <span>/</span>
              <Link to={`/shop?category=${primaryCategory.slug}`} className="hover:text-gold-400 transition-colors">
                {primaryCategory.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-white/60">{product.name}</span>
        </div>
      </div>

      {/* Main product section */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-neutral-800/30 rounded-2xl overflow-hidden group cursor-pointer">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={images[activeImage] || ''}
                  alt={product.name}
                  className="w-full h-full object-contain p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setZoomed(true)}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(i => (i - 1 + images.length) % images.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(i => (i + 1) % images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(true);
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-xl text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110"
              >
                <ZoomIn size={16} />
              </button>

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <motion.span
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="px-4 py-1.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 text-[10px] font-bold tracking-[0.15em] uppercase rounded-full shadow-lg shadow-gold-400/30"
                  >
                    −{discountPercentage}%
                  </motion.span>
                )}
              </div>

              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage(i);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        activeImage === i 
                          ? 'w-6 bg-gold-400' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      activeImage === i 
                        ? 'border-gold-400 shadow-lg shadow-gold-400/20' 
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="pt-0 lg:pt-4">
            <div className="flex items-center gap-2 mb-3">
              {categoryArray.length > 0 ? (
                categoryArray.slice(0, 2).map((cat: any, idx: number) => (
                  <span 
                    key={cat.id || idx} 
                    className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400"
                  >
                    {cat.name}
                    {idx < Math.min(categoryArray.length, 2) - 1 && ' / '}
                  </span>
                ))
              ) : (
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-neutral-500">
                  Uncategorized
                </span>
              )}
            </div>
            
            <h1 className="font-serif text-2xl md:text-3xl font-light text-white mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className={`text-2xl font-bold ${
                hasDiscount ? 'text-gold-400' : 'text-white'
              }`}>
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && !selectedSize && (
                <span className="text-base text-white/40 line-through">
                  ${(product.price * quantity).toFixed(2)}
                </span>
              )}
              {hasDiscount && !selectedSize && (
                <span className="px-2.5 py-0.5 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[10px] font-medium rounded-full">
                  Save ${((product.price - product.sale_price!) * quantity).toFixed(2)}
                </span>
              )}
            </div>

            <div className="space-y-5">
              {sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/60">Choose Your Size</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {sizes.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSelectedSize(s)}
                        className={`py-3 px-4 text-sm font-medium rounded-xl border transition-all duration-300 flex items-center justify-between ${
                          selectedSize?.label === s.label
                            ? 'bg-gold-400 text-neutral-900 border-gold-400 shadow-lg shadow-gold-400/20'
                            : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium">{s.label}</span>
                        <span className="font-bold">${s.price.toFixed(0)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/60 mb-2.5">Quantity</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white/5 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                      className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-l-xl transition-all duration-200"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center text-white font-medium text-sm">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))} 
                      className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-r-xl transition-all duration-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30">
                    {product.stock_quantity} in stock
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || product.stock_quantity === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-medium tracking-widest uppercase rounded-xl transition-all duration-300 ${
                    added 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 hover:shadow-lg hover:shadow-gold-400/30 hover:scale-[1.02]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ShoppingBag size={16} />
                  {product.stock_quantity === 0 ? 'Out of Stock' : added ? 'Added to Bag ✓' : 'Add to Bag'}
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => authUser ? toggleWishlist(product.id) : navigate('/login')}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                    inWishlist 
                      ? 'border-gold-400 bg-gold-400/10 text-gold-400 shadow-lg shadow-gold-400/20' 
                      : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="w-12 h-12 rounded-xl border border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
                >
                  <Share2 size={18} />
                </motion.button>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/60 mb-2">Description</p>
              <p className="text-sm text-white/60 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-light text-white">You May Also Like</h2>
              <Link to="/shop" className="text-xs text-white/40 hover:text-gold-400 transition-colors flex items-center gap-1.5">
                View All
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Zoom modal */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
            onClick={() => setZoomed(false)}
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(false);
              }}
            >
              <X size={20} />
            </motion.button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[activeImage]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
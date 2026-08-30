import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, X, Gift, Sparkles, Droplet, Award, Heart, Shield, Leaf } from 'lucide-react';
import whatsappLogo from "../assets/WhatsApp_icon.png";
import { supabase } from '../lib/supabase';
import type { Product, Category, Banner } from '../types';
import ProductCard from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import ScrollToTop from '../components/ScrollToTop';

export default function HomePage() {
  const { authUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [defaultBanner, setDefaultBanner] = useState<Banner | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasUsedDiscount, setHasUsedDiscount] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 150]);

  // Check if user has used the signup discount and get their role
  useEffect(() => {
    const checkUserDiscountStatus = async () => {
      if (!authUser) {
        setIsCheckingUser(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('has_used_signup_discount, role')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error checking discount status:', error);
          setIsCheckingUser(false);
          return;
        }

        setHasUsedDiscount(data?.has_used_signup_discount || false);
        setUserRole(data?.role || null);
        setIsCheckingUser(false);
      } catch (error) {
        console.error('Error:', error);
        setIsCheckingUser(false);
      }
    };

    checkUserDiscountStatus();
  }, [authUser]);

  // Show popup logic - Show on every reload for customers who haven't used the discount
  useEffect(() => {
    // Don't show popup if still checking user status
    if (isCheckingUser) return;

    // Check if user is admin - don't show popup for admins
    if (authUser && userRole === 'admin') {
      setShowPopup(false);
      return;
    }

    // Check if user is customer and hasn't used the discount
    if (authUser && userRole === 'customer' && !hasUsedDiscount) {
      // Show popup on every reload for eligible customers
      setShowPopup(true);
      return;
    }

    // For non-authenticated users, show popup based on localStorage
    if (!authUser) {
      const hasDismissed = localStorage.getItem('welcomePopupDismissed');
      if (!hasDismissed) {
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setShowPopup(false);
      }
      return;
    }

    // Hide popup for all other cases
    setShowPopup(false);
  }, [authUser, hasUsedDiscount, isCheckingUser, userRole]);

  const handleClosePopup = () => {
    setShowPopup(false);
    // For non-authenticated users, store dismissal in localStorage
    if (!authUser) {
      localStorage.setItem('welcomePopupDismissed', 'true');
    }
    // For authenticated users, we don't store dismissal because we check the DB
  };

  // Handle signup and mark discount as used
  const handleSignUp = async () => {
    if (authUser) {
      // Mark the discount as used when user signs up
      try {
        const { error } = await supabase
          .from('users')
          .update({ has_used_signup_discount: true })
          .eq('id', authUser.id);

        if (error) {
          console.error('Error updating discount status:', error);
        } else {
          setHasUsedDiscount(true);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    setShowPopup(false);
    localStorage.setItem('welcomePopupDismissed', 'true');
    
    // Navigate to register page
    window.location.href = '/register';
  };

  useEffect(() => {
    // Fetch products with categories through the junction table
    const fetchProducts = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase
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
          .order('created_at', { ascending: false })
          .limit(8);

        if (productsError) {
          console.error('Products error:', productsError);
          setProducts([]);
        } else {
          console.log('Products fetched:', productsData);
          setProducts((productsData as Product[]) ?? []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .limit(6);

        if (error) {
          console.error('Categories error:', error);
          setCategories([]);
        } else {
          console.log('Categories fetched:', data);
          setCategories((data as Category[]) ?? []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };

    // Fetch banners
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('active', true)
          .order('sort_order');

        if (error) {
          console.error('Banners error:', error);
          setBanners([]);
        } else {
          console.log('Banners fetched:', data);
          setBanners((data as Banner[]) ?? []);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
        setBanners([]);
      }
    };

    // Fetch default banner
    const fetchDefaultBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('sort_order', 1)
          .maybeSingle();

        if (error) {
          console.error('Default banner error:', error);
          setDefaultBanner(null);
        } else {
          console.log('Default banner fetched:', data);
          setDefaultBanner(data as Banner ?? null);
        }
      } catch (err) {
        console.error('Error fetching default banner:', err);
        setDefaultBanner(null);
      }
    };

    // Fetch all data
    Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchBanners(),
      fetchDefaultBanner()
    ]).then(() => {
      setDataLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (banners.length === 0 || isPaused) return;
    
    const interval = setInterval(() => {
      setActiveBanner((current) => (current + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const heroBanner = banners[activeBanner];
  const heroImage = heroBanner?.image_url ?? defaultBanner?.image_url ?? '';

  // Supabase storage URL
  const SUPABASE_URL = 'https://zzhwmxgjuesecmjoigfs.supabase.co/storage/v1/object/public';
  const BUCKET_NAME = 'images';
  const FOLDER_NAME = 'ambertouch';
  const storyImageUrl = `${SUPABASE_URL}/${BUCKET_NAME}/${FOLDER_NAME}/OurStoryImg1.png`;

  // Perfume features data
  const perfumeFeatures = [
    {
      icon: Sparkles,
      title: 'Premium Ingredients',
      description: 'Crafted with the finest essential oils and natural extracts for a luxurious scent experience.'
    },
    {
      icon: Droplet,
      title: 'Long-Lasting Fragrance',
      description: 'Our unique formulation ensures your scent stays fresh and captivating throughout the day.'
    },
    {
      icon: Award,
      title: 'Expertly Blended',
      description: 'Each fragrance is carefully composed by master perfumers with years of experience.'
    },
    {
      icon: Heart,
      title: 'Built with Scent DNA Technology',
      description: 'Advanced scent analysis for a precise, balanced, and distinctive fragrance.'
    },
    {
      icon: Shield,
      title: 'Authentic Quality',
      description: 'Every bottle is guaranteed authentic with the highest quality standards.'
    },
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Sustainable packaging and environmentally conscious production methods.'
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Popup Modal - Shows for customers who haven't used the discount and on every reload */}
      {!isCheckingUser && 
       showPopup && 
       !(authUser && userRole === 'admin') &&
       (authUser ? (userRole === 'customer' && !hasUsedDiscount) : true) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClosePopup}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gold-400" />
            
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mt-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-100 rounded-full mb-6">
                <Gift size={32} className="text-gold-400" />
              </div>
              
              <h3 className="text-2xl font-serif font-light text-neutral-900 mb-3">
                Welcome to AmberTouch!
              </h3>
              
              <div className="mb-6">
                <div className="inline-block bg-gold-50 px-4 py-2 rounded-full mb-4">
                  <span className="text-3xl font-bold text-gold-400">10% OFF</span>
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Get <span className="font-semibold text-gold-400">10% discount</span> on any perfume 
                  you choose in your first order!
                </p>
                <p className="text-neutral-500 text-xs mt-2">
                  ✨ Just sign in to our website and order now!
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/register"
                  onClick={handleSignUp}
                  className="block w-full py-3.5 bg-gold-400 text-neutral-900 rounded-lg font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Sign Up & Get Discount
                </Link>
                <Link
                  to="/shop"
                  onClick={handleClosePopup}
                  className="block w-full py-3.5 bg-neutral-950 text-gold-400 rounded-lg font-medium border border-neutral-800 hover:bg-neutral-900 hover:text-gold-400 hover:scale-[1.02] transition-all duration-300"
                >
                  Browse Collection
                </Link>
                <button
                  onClick={handleClosePopup}
                  className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  No thanks, continue shopping
                </button>
              </div>

              <p className="text-[10px] text-neutral-400 mt-4">
                *Offer valid for first-time customers only
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <motion.div 
          style={{ y: heroY }} 
          className="absolute inset-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {banners.map((banner, i) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: i === activeBanner ? 1 : 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img
                src={banner.image_url ?? heroImage}
                alt={banner.title ?? ''}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        </motion.div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-6 border border-gold-400/30 px-6 py-2 rounded-full bg-black/20 backdrop-blur-sm inline-block"
          >
            {heroBanner?.subtitle ?? 'Leave A Trace'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-serif text-4xl md:text-5xl lg:text-7xl font-light text-white max-w-4xl text-balance"
          >
            {heroBanner?.title ?? 'Amber Touch'}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link 
              to='/shop'
              className="group relative px-8 py-4 bg-gradient-to-r from-gold-400 to-gold-500 text-neutral-900 rounded-xl font-medium overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold-400/30 hover:shadow-gold-400/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Shop Now
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gold-500 to-gold-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <span className="text-xs text-gold-400/70 tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-10 bg-gradient-to-b from-gold-400 to-transparent"
          />
        </motion.div>

        {banners.length > 1 && (
          <div className="absolute bottom-8 right-8 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBanner(i)}
                className={`transition-all duration-300 ${
                  i === activeBanner 
                    ? 'w-8 h-1 bg-gold-400 rounded-full' 
                    : 'w-1.5 h-1.5 bg-white/40 rounded-full hover:bg-white/60 hover:scale-125'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Brand strip */}
      <section className="bg-gold-400 py-4 overflow-hidden">
        <div className="flex">
          <motion.div
            animate={{ x: '-50%' }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex shrink-0 items-center gap-12 whitespace-nowrap"
          >
            {Array(10).fill(null).map((_, i) => (
              <span key={i} className="text-xs tracking-[0.3em] uppercase text-neutral-900">
                {[
                  'Luxury Perfume Collection',
                  'Signature Fragrances for Every Occasion',
                  'Premium Quality Oils & Essences',
                  '30-Day Scent Satisfaction Guarantee'
                ][i % 4]}
                &nbsp;&nbsp;·
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Showcase - Centered */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-gold-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Explore</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-gold-400">Shop by Category</h2>
            <div className="w-20 h-0.5 bg-gold-400/50 mx-auto mt-4" />
          </motion.div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="w-[140px] md:w-[160px]"
              >
                <Link to={`/shop?category=${cat.slug}`} className="group block text-center">
                  <div className="aspect-square overflow-hidden bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-700 transition-all duration-300 group-hover:border-gold-400/50 group-hover:shadow-lg group-hover:shadow-gold-400/10">
                    <img
                      src={cat.image_url ?? ''}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-3 text-xs font-medium tracking-wider uppercase text-neutral-400 group-hover:text-gold-400 truncate transition-colors">
                    {cat.name}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-neutral-900">
        <div className="px-4 max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-neutral-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Just In</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-gold-400">Our Products</h2>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-gold-400 transition-colors group">
              View All 
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(!dataLoaded ? Array(8).fill(null) : products).map((p, i) =>
              p ? <ProductCard key={p.id} product={p} index={i} /> : (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-800 rounded-lg" />
                  <div className="mt-4 h-3 bg-neutral-800 rounded w-2/3" />
                  <div className="mt-2 h-4 bg-neutral-800 rounded w-1/2" />
                </div>
              )
            )}
          </div>
          <div className="text-center mt-10 md:hidden">
            <Link to="/shop" className="inline-block px-8 py-3 border-2 border-gold-400/50 text-gold-400 rounded-xl font-medium hover:bg-gold-400 hover:text-neutral-900 transition-all duration-300">
              View All
            </Link>
          </div>
        </div>
      </section>

      {/* Half Photo + Half Our Story Section */}
      <section className="py-20 bg-neutral-950">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-neutral-800">
            {/* Image Half */}
            <div className="relative h-64 lg:h-auto min-h-[400px]">
              <img
                src={storyImageUrl}
                alt="Our Story"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </div>
            
            {/* Content Half */}
            <div className="p-8 md:p-12 bg-neutral-900 flex flex-col justify-center">
              <span className="text-gold-400 text-xs font-medium tracking-[0.3em] uppercase mb-4">Our Story</span>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-gold-400 mb-6">
                The Amber Touch Story
              </h2>
              <p className="text-neutral-300 leading-relaxed mb-4">
                Amber Touch was created around one simple idea: a scent should be more than something you wear. 
                It should become part of how people remember you.
              </p>
              <p className="text-neutral-400 leading-relaxed mb-6">
                We believe fragrance is a form of presence — subtle, personal, and often remembered long after 
                the moment is gone. That's why we created Amber Touch: to offer scents inspired by fragrances 
                people already love, while creating an experience and identity of our own.
              </p>
              <Link 
                to="/about" 
                className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors group font-medium"
              >
                Read More About Us
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Perfume Features Section - The Amber Touch Experience */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-gold-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">Why Choose Us</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-gold-400">The Amber Touch Experience</h2>
            <div className="w-20 h-0.5 bg-gold-400/50 mx-auto mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perfumeFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-neutral-800/50 backdrop-blur-sm p-6 rounded-2xl border border-neutral-700 hover:border-gold-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/5 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center shrink-0 group-hover:bg-gold-400/20 transition-colors duration-300">
                      <Icon size={22} className="text-gold-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-100 mb-1.5">{feature.title}</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/96170702697?text=Hello%20AmberTouch!%20I%20have%20a%20question%20about%20your%20perfumes." 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-green-500 text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 shadow-green-500/30"
      >
        <img src={whatsappLogo} alt="WhatsApp" width="26" height="26" />
      </a>
      <ScrollToTop />
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, User, Search, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../types';

const NAV_LINKS = [
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'New Arrivals', href: '/shop?filter=new' },
      { label: 'Best Sellers', href: '/shop?filter=bestsellers' },
      { label: 'Handbags', href: '/shop?category=handbags' },
      { label: 'Shoes', href: '/shop?category=shoes' },
      { label: 'Jewelry', href: '/shop?category=jewelry' },
      { label: 'Clothing', href: '/shop?category=clothing' },
      { label: 'Accessories', href: '/shop?category=accessories' },
      { label: 'Watches', href: '/shop?category=watches' },
    ],
  },
  { label: 'Collections', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenu, setMegaMenu] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, dispatch } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { profile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isTransparent = location.pathname === '/' && !scrolled;

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setMegaMenu(null);
  }, [location]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isTransparent
            ? 'bg-transparent'
            : 'bg-neutral-900/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-neutral-800'
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.children && setMegaMenu(link.label)}
                  onMouseLeave={() => setMegaMenu(null)}
                >
                  <Link
                    to={link.href}
                    className={`flex items-center gap-1 text-xs font-medium tracking-widest uppercase transition-colors duration-200 ${
                      isTransparent ? 'text-white hover:text-gold-400' : 'text-neutral-300 hover:text-gold-400'
                    }`}
                  >
                    {link.label}
                    {link.children && <ChevronDown size={12} className="text-neutral-500" />}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Logo */}
            <Link
              to="/"
              className={`font-serif text-xl md:text-2xl font-light tracking-widest uppercase transition-colors duration-200 ${
                isTransparent ? 'text-white' : 'text-gold-400'
              }`}
            >
              Amber Touch
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-1.5 transition-colors duration-200 ${
                  isTransparent ? 'text-white hover:text-gold-400' : 'text-neutral-300 hover:text-gold-400'
                }`}
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              <Link
                to="/account/wishlist"
                className={`relative p-1.5 transition-colors duration-200 ${
                  isTransparent ? 'text-white hover:text-gold-400' : 'text-neutral-300 hover:text-gold-400'
                }`}
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold-400 text-neutral-900 text-[10px] flex items-center justify-center rounded-full font-medium">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => dispatch({ type: 'TOGGLE_CART' })}
                className={`relative p-1.5 transition-colors duration-200 ${
                  isTransparent ? 'text-white hover:text-gold-400' : 'text-neutral-300 hover:text-gold-400'
                }`}
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold-400 text-neutral-900 text-[10px] flex items-center justify-center rounded-full font-medium">
                    {totalItems}
                  </span>
                )}
              </button>

              {profile ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(u => !u)}
                    className={`flex items-center gap-2 p-1.5 transition-colors duration-200 ${
                      isTransparent ? 'text-white hover:text-gold-400' : 'text-neutral-300 hover:text-gold-400'
                    }`}
                  >
                    <User size={18} />
                    <span className="hidden sm:inline text-xs font-medium tracking-wide max-w-[120px] truncate text-neutral-300">
                      {profile.full_name || profile.email}
                    </span>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 shadow-xl border border-neutral-800 rounded-lg py-2 overflow-hidden"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        {profile.role === 'admin' && (
                          <Link to="/admin" className="block px-4 py-2.5 text-sm text-neutral-300 hover:text-gold-400 hover:bg-neutral-800 transition-colors">
                            Dashboard
                          </Link>
                        )}
                        <Link to="/account" className="block px-4 py-2.5 text-sm text-neutral-300 hover:text-gold-400 hover:bg-neutral-800 transition-colors">
                          My Account
                        </Link>
                        <Link to="/account/orders" className="block px-4 py-2.5 text-sm text-neutral-300 hover:text-gold-400 hover:bg-neutral-800 transition-colors">
                          Orders
                        </Link>
                        <Link to="/account/wishlist" className="block px-4 py-2.5 text-sm text-neutral-300 hover:text-gold-400 hover:bg-neutral-800 transition-colors">
                          Wishlist
                        </Link>
                        <button 
                          onClick={signOut} 
                          className="block w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:text-gold-400 hover:bg-neutral-800 transition-colors border-t border-neutral-800 mt-1 pt-3"
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`p-1.5 transition-colors duration-200 ${
                    isTransparent ? 'text-white hover:text-gold-400' : 'text-neutral-300 hover:text-gold-400'
                  }`}
                  aria-label="Account"
                >
                  <User size={18} />
                </Link>
              )}

              <button
                className={`lg:hidden p-1.5 transition-colors duration-200 ${
                  isTransparent ? 'text-white' : 'text-neutral-300'
                }`}
                onClick={() => setMobileOpen(true)}
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {megaMenu === 'Shop' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="hidden lg:block absolute top-full left-0 right-0 bg-neutral-900 backdrop-blur-md border-t border-neutral-800 shadow-2xl shadow-black/30"
              onMouseEnter={() => setMegaMenu('Shop')}
              onMouseLeave={() => setMegaMenu(null)}
            >
              <div className="max-w-screen-xl mx-auto px-8 py-8">
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <p className="text-gold-400 text-xs font-medium tracking-[0.2em] uppercase mb-4">Categories</p>
                    <ul className="space-y-2.5">
                      {categories.map(cat => (
                        <li key={cat.id}>
                          <Link to={`/shop?category=${cat.slug}`} className="text-sm text-neutral-300 hover:text-gold-400 transition-colors">
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-span-3 grid grid-cols-3 gap-4">
                    {categories.slice(0, 3).map(cat => (
                      <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group block overflow-hidden rounded-lg">
                        <div className="aspect-[4/3] overflow-hidden bg-neutral-800 rounded-lg">
                          <img
                            src={cat.image_url ?? ''}
                            alt={cat.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-2 text-sm font-medium text-neutral-300 group-hover:text-gold-400 transition-colors">
                          {cat.name}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-neutral-900 backdrop-blur-lg flex items-start justify-center pt-32 px-4"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-gold-400 transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              <p className="text-gold-400 text-sm font-medium tracking-[0.3em] uppercase text-center mb-6">Search</p>
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full py-4 border-b-2 border-gold-400/50 bg-transparent text-2xl font-serif text-neutral-100 placeholder:text-white focus:border-gold-400 focus:outline-none transition-colors"
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2">
                  <Search size={22} className="text-neutral-400 hover:text-gold-400 transition-colors" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-80 bg-neutral-900 shadow-2xl shadow-black/50 overflow-y-auto border-l border-neutral-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <span className="font-serif text-lg tracking-widest uppercase text-gold-400">Amber Touch</span>
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-neutral-400 hover:text-gold-400 transition-colors" />
                </button>
              </div>
              <nav className="p-6 space-y-1">
                {NAV_LINKS.map(link => (
                  <div key={link.label}>
                    <Link
                      to={link.href}
                      className="block py-3 text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-gold-400 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {link.children && (
                      <div className="pl-4 space-y-1 py-1 border-l-2 border-neutral-800 ml-2">
                        {categories.map(cat => (
                          <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="block py-2 text-sm text-neutral-400 hover:text-gold-400 transition-colors" onClick={() => setMobileOpen(false)}>
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-neutral-800">
                  {profile ? (
                    <>
                      <Link to="/account" className="block py-3 text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-gold-400 transition-colors" onClick={() => setMobileOpen(false)}>
                        My Account
                      </Link>
                      <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left py-3 text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-gold-400 transition-colors">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block py-3 text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-gold-400 transition-colors" onClick={() => setMobileOpen(false)}>
                        Sign In
                      </Link>
                      <Link to="/register" className="block py-3 text-sm font-medium tracking-widest uppercase text-neutral-300 hover:text-gold-400 transition-colors" onClick={() => setMobileOpen(false)}>
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
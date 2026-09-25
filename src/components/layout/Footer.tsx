import { Link } from 'react-router-dom';
import { Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Category } from '../../types';
import { supabase } from '../../lib/supabase';

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  return (
    <footer className="bg-neutral-950 text-neutral-300">
      {/* Main footer */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="font-serif text-2xl text-gold-400 tracking-widest">
              AmberTouch
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              Luxury perfumes and fragrances for the discerning customer. Explore our curated collection and indulge in the art of scent.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a 
                href="https://www.instagram.com/ambertouchlb?igsh=MTUwcDM0Y3FrYnBmdA==&igsi=MTUwcDM0Y3FrYnBmdA==" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-gold-400 transition-colors" 
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://www.tiktok.com/@ambertouchlb?_r=1&_t=ZS-99FljwSADWi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-gold-400 transition-colors" 
                aria-label="TikTok"
              >
                <svg 
                  className="w-[18px] h-[18px]" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gold-400 mb-5">Shop</p>
            <ul className="space-y-3">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/shop?category=${cat.slug}`} className="text-sm text-neutral-400 hover:text-gold-400 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gold-400 mb-5">Information</p>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-neutral-400 hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gold-400 mb-5">Customer Care</p>
            <ul className="space-y-3">
              {[
                { label: 'My Account', href: '/account' },
                { label: 'Order Tracking', href: '/account/orders' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-neutral-400 hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gold-400 mb-5">Contact</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-neutral-500 mt-0.5 shrink-0" />
                <span className="text-sm text-neutral-400">Online Store</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-neutral-500 shrink-0" />
                <a 
                  href="tel:+96170702697" 
                  className="text-sm text-neutral-400 hover:text-gold-400 transition-colors"
                >
                  +96170702697
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-neutral-500 shrink-0" />
                <a 
                  href="mailto:ambertouch2026@gmail.com" 
                  className="text-sm text-neutral-400 hover:text-gold-400 transition-colors break-all sm:break-normal"
                >
                  ambertouch2026@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800 py-6 px-4">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} AmberTouch. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy-policy" className="hover:text-gold-400 transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-gold-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
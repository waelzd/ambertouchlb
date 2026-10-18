import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

type Props = {
  product: Product;
  index?: number;
};

export default function ProductCard({ product, index = 0 }: Props) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { authUser } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  
  const inWishlist = isInWishlist(product.id);
  const sizes = product.sizes || [];

  // State to track which size is currently selected on the card
  const [selectedSize, setSelectedSize] = useState(
    sizes.length > 0 ? sizes[0] : null
  );

  // Determine current price based on selected size (or fallback to base product price)
  const currentPrice = selectedSize 
    ? (selectedSize.sale_price ?? selectedSize.price) 
    : (product.sale_price ?? product.price);

  const basePrice = selectedSize 
    ? selectedSize.price 
    : product.price;

  const hasDiscount = currentPrice < basePrice;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authUser) { navigate('/login'); return; }
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Add item with the currently selected size
    addItem(
      product, 
      undefined, 
      selectedSize?.label ?? undefined, 
      currentPrice, 
      1
    );
  };

  const productSlug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group flex flex-col"
    >
      <Link to={`/product/${productSlug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-[#2a2532] overflow-hidden rounded-2xl">
          <img
            src={product.image_urls[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Second image on hover */}
          {product.image_urls[1] && (
            <img
              src={product.image_urls[1]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center bg-[#1c1823]/80 backdrop-blur-md rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              inWishlist ? 'text-gold-400' : 'text-neutral-400 hover:text-gold-400'
            }`}
          >
            <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          {/* Out of stock overlay */}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-[#1c1823]/70 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xs font-medium tracking-widest uppercase text-neutral-400 border border-neutral-700 px-4 py-2 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info Section */}
      <div className="pt-4 flex-1 flex flex-col">
        {/* Title & Brand */}
        <div className="mb-1">
          <h3 className="font-serif text-lg font-medium text-white leading-tight">
            {product.name}
          </h3>
          {/* Optional: Add brand or subtitle here if you have it in your DB */}
          <p className="text-xs text-gold-400 mt-0.5">For Him</p>
        </div>

        {/* Price */}
        <div className="mt-3 mb-4 flex items-baseline gap-2">
          <span className={`text-xl font-bold ${hasDiscount ? 'text-gold-400' : 'text-white'}`}>
            ${currentPrice.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-neutral-500 line-through">
              ${basePrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* Size Selector (Pills) */}
        {sizes.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
            {sizes.map((s) => (
              <button
                key={s.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSize(s);
                }}
                className={`py-2 text-xs font-medium rounded-full border transition-all duration-300 ${
                  selectedSize?.label === s.label
                    ? 'bg-gold-400 text-[#1c1823] border-gold-400'
                    : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className="w-full py-3 bg-[#eed08f] text-[#1c1823] text-sm font-semibold rounded-full hover:bg-[#f4db9e] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Add to Cart       
       </button>
      </div>
    </motion.div>
  );
}
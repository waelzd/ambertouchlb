import { Link } from 'react-router-dom';
import { Heart, Eye, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Props = {
  product: Product;
  index?: number;
};

export default function ProductCard({ product, index = 0 }: Props) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(product.id);
  const displayPrice = product.sale_price ?? product.price;
  const hasDiscount = product.sale_price !== null;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authUser) { navigate('/login'); return; }
    toggleWishlist(product.id);
  };

  // Parse sizes from product.sizes (assuming it's a JSON field)
  // Example format: [{ "size": "120ML", "price": 25, "sale_price": 19 }, { "size": "60ML", "price": 15, "sale_price": 11 }]
  const sizes = product.sizes || [];
  //const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group"
    >
      <Link to={`/product/${encodeURIComponent(product.name)}`}  className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-neutral-800 overflow-hidden rounded-lg">
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

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="px-3 py-1 bg-gold-400 text-neutral-900 text-xs font-medium tracking-wider uppercase rounded-full">
                Sale
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleWishlist}
              className={`w-9 h-9 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                inWishlist ? 'text-gold-400' : 'text-neutral-400 hover:text-gold-400'
              }`}
              aria-label="Add to wishlist"
            >
              <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Show Product Button */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out px-3 pb-3">
            <Link
              to={`/product/${encodeURIComponent(product.name)}`} 
              className="w-full flex items-center justify-center gap-2 py-3 bg-gold-400 text-neutral-900 rounded-lg font-medium text-sm transition-all duration-300 hover:bg-gold-300 active:scale-[0.98] shadow-lg shadow-gold-400/20 hover:shadow-gold-400/30"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye size={16} />
              Show Product
            </Link>
          </div>

          {/* Out of stock overlay */}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xs font-medium tracking-widest uppercase text-neutral-400 border border-neutral-700 px-4 py-2 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 space-y-1.5">
          {/* Category */}
          <p className="text-[10px] font-medium tracking-wider uppercase text-gold-400">
            {(product as any).categories?.name || 'Uncategorized'}
          </p>

        {/* Product Name */}
        <h3 className="font-serif text-xl font-light text-neutral-200 group-hover:text-gold-400 transition-colors line-clamp-2">
          {product.name}
        </h3>
          
          {/* Sizes with Prices */}
          {sizes.length > 0 && (
            <div className="mt-2.5">
              <p className="text-[10px] font-medium tracking-wider uppercase text-neutral-500 mb-1.5 flex items-center gap-1.5">
                <Package size={12} />
                Available Sizes
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size: any, idx: number) => {
                  const hasSizeDiscount = size.sale_price !== null && size.sale_price !== undefined;
                  const sizePrice = size.sale_price ?? size.price;

                  return (
                    <div
                      key={idx}
                      title={`Price for ${size.label}: $${sizePrice.toFixed(2)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/50 rounded-lg border border-neutral-700 hover:border-gold-400/50 transition-colors duration-200"
                    >
                      <span className="text-xs font-semibold text-neutral-200">{size.label}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-xs font-bold text-gold-400">
                        ${sizePrice.toFixed(2)}
                      </span>
                      {hasSizeDiscount && (
                        <span className="text-[10px] text-neutral-500 line-through">
                          ${size.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Fallback price if no sizes */}
          {sizes.length === 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-semibold ${hasDiscount ? 'text-gold-400' : 'text-neutral-200'}`}>
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-neutral-500 line-through">${product.price.toFixed(2)}</span>
              )}
              {(product as any).size && (
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  / {(product as any).size}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
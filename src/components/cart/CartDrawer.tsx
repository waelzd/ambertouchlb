import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function CartDrawer() {
  const { items, isOpen, dispatch, removeItem, updateQty, subtotal, totalItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const shippingCost = 4;
  const handleToggleWishlist = async (productId: string) => {
    if (!productId) return;
    await toggleWishlist(productId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
            onClick={() => dispatch({ type: 'CLOSE_CART' })}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
            className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[420px] bg-neutral-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag size={20} className="text-gold-400" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold-400 text-neutral-900 text-[10px] font-bold flex items-center justify-center rounded-full">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="font-serif text-xl font-light text-gold-400">Your Cart</span>
              </div>
              <button 
                onClick={() => dispatch({ type: 'CLOSE_CART' })} 
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-500 hover:text-gold-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-neutral-950">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center">
                    <ShoppingBag size={40} className="text-neutral-600" />
                  </div>
                  <p className="font-serif text-2xl font-light text-neutral-400">Your cart is empty</p>
                  <p className="text-sm text-neutral-500 max-w-xs">
                    Looks like you haven't added anything to your cart yet. Start exploring our collection!
                  </p>
                  <Link 
                    to="/shop" 
                    onClick={() => dispatch({ type: 'CLOSE_CART' })}
                    className="bg-gold-400 text-neutral-900 hover:bg-gold-500 px-6 py-3 rounded-xl font-medium transition-all inline-block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 bg-neutral-800/50 rounded-xl p-4 shadow-lg hover:shadow-gold-400/10 transition-all border border-neutral-700 hover:border-gold-400/30"
                    >
                      <div className="w-24 h-28 bg-neutral-700 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={item.product.image_urls?.[0] || ''}
                          alt={item.product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${item.product.name}`}
                            onClick={() => dispatch({ type: 'CLOSE_CART' })}
                            className="text-sm font-medium text-neutral-200 hover:text-gold-400 transition-colors line-clamp-2 flex-1"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-neutral-500 hover:text-red-400 transition-colors shrink-0 mt-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {(item.color || item.size) && (
                          <p className="text-xs text-neutral-500 mt-1">
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-base font-semibold text-gold-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-700 hover:text-gold-400 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-neutral-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-700 hover:text-gold-400 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => handleToggleWishlist(item.product.id)}
                            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-gold-400 transition-colors"
                          >
                            <Heart 
                              size={12} 
                              className={isInWishlist(item.product.id) ? 'fill-gold-400 text-gold-400' : ''}
                            />
                            {isInWishlist(item.product.id) ? 'Saved' : 'Save'}
                          </button>
                          <span className="text-neutral-700">|</span>
                          <Link
                            to={`/product/${item.product.name}`}
                            onClick={() => dispatch({ type: 'CLOSE_CART' })}
                            className="text-xs text-neutral-500 hover:text-gold-400 transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-t border-neutral-800 bg-neutral-900 px-6 py-6 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Subtotal</span>
                    <span className="font-medium text-neutral-200">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Shipping</span>
                    <span className="text-sm text-neutral-400">
                      ${shippingCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-neutral-800 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-neutral-200">Total</span>
                    <span className="text-xl font-semibold text-gold-400">${(subtotal + shippingCost).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    onClick={() => dispatch({ type: 'CLOSE_CART' })}
                    className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-gold-500 text-neutral-900 rounded-xl font-medium hover:from-gold-500 hover:to-gold-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gold-400/20 hover:shadow-gold-400/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => dispatch({ type: 'CLOSE_CART' })}
                    className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-xl font-medium hover:bg-neutral-700 hover:text-gold-400 transition-colors flex items-center justify-center gap-2 border border-neutral-700"
                  >
                    <ShoppingBag size={16} />
                    <span>View Full Cart</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
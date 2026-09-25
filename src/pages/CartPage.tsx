import { Link } from 'react-router-dom';
import { Minus, Plus, X, ArrowRight, ShoppingBag, Trash2, Shield, Truck, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCart();

  const shipping = 4;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pt-28 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 rounded-full bg-neutral-800/50 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-neutral-600" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-3">Your bag is empty</h1>
          <p className="text-neutral-400 mb-8">Add some items to get started</p>
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
          >
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pt-20 md:pt-28 pb-20 px-4">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="py-10 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-1">Shopping Bag</h1>
              <p className="text-sm text-neutral-400">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your bag
              </p>
            </div>
            <button 
              onClick={clearCart} 
              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors duration-200"
            >
              <Trash2 size={14} />
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 mt-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-1">
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-4 gap-4 pb-3 border-b border-white/5 text-[10px] font-medium tracking-[0.15em] uppercase text-neutral-500">
              <span className="col-span-2">Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
            </div>

            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ delay: index * 0.05 }}
                  className="grid md:grid-cols-4 gap-4 items-center py-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-200 rounded-lg px-2"
                >
                  {/* Product */}
                  <div className="col-span-2 flex gap-4">
                    <div className="w-20 h-24 bg-neutral-800/50 rounded-lg overflow-hidden shrink-0 border border-white/5">
                      <img
                        src={item.product.image_urls?.[0] || ''}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/product/${item.product.name}`} 
                        className="font-medium text-sm text-white hover:text-gold-400 transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      {(item.color || item.size) && (
                        <p className="text-xs text-neutral-500 mt-1">{item.size}</p>
                      )}
                      <p className="text-sm font-medium text-gold-400 mt-1.5">${item.price.toFixed(2)}</p>
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors duration-200"
                      >
                        <X size={12} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-start md:justify-center">
                    <div className="flex items-center bg-neutral-800/50 border border-white/10 rounded-lg">
                      <button 
                        onClick={() => updateQty(item.id, item.quantity - 1)} 
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 rounded-l-lg transition-all duration-200"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-9 text-center text-sm text-white font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.id, item.quantity + 1)} 
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 rounded-r-lg transition-all duration-200"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <p className="text-sm font-semibold text-white text-right hidden md:block">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-white/5">
              <Link 
                to="/shop" 
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-gold-400 transition-colors duration-200 group"
              >
                <ArrowRight size={15} className="rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
                Continue Shopping
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <Shield size={12} className="text-gold-400" />
                  Secure Checkout
                </div>
                <span className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <Truck size={12} className="text-gold-400" />
                  Free Shipping
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 sticky top-28">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-gold-400 rounded-full" />
                <h2 className="font-serif text-xl font-light text-white">Order Summary</h2>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-neutral-400">Shipping</span>
                  <span className="text-emerald-400 font-medium">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-neutral-400">Estimated Total</span>
                  <span className="text-2xl font-bold text-gold-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                to="/checkout" 
                className="flex items-center justify-center gap-2 w-full py-3.5 mt-8 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <ShoppingBag size={18} />
                Complete Order
              </Link>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-neutral-500 flex items-center justify-center gap-1.5">
                  <Shield size={12} className="text-gold-400" />
                  Secure checkout powered by Stripe
                </p>
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Truck size={16} className="mx-auto text-gold-400 mb-1.5" />
                  <p className="text-[8px] font-medium tracking-wider uppercase text-neutral-500">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield size={16} className="mx-auto text-gold-400 mb-1.5" />
                  <p className="text-[8px] font-medium tracking-wider uppercase text-neutral-500">Secure Payment</p>
                </div>
                <div className="text-center">
                  <RefreshCw size={16} className="mx-auto text-gold-400 mb-1.5" />
                  <p className="text-[8px] font-medium tracking-wider uppercase text-neutral-500">Easy Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
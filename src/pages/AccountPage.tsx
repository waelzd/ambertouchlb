import { useEffect, useState, useRef } from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User, Package, Heart, MapPin, LogOut, ChevronRight, CheckCircle, X, Trash2, Edit2, Minus, Plus,  Clock, RefreshCw, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Order, WishlistItem } from '../types';
import ProductCard from '../components/products/ProductCard';

function AccountNav() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = [
    { to: '/account', label: 'Profile', icon: User, exact: true },
    { to: '/account/orders', label: 'Orders', icon: Package },
    { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <nav className="space-y-1">
      {links.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center justify-between px-5 py-3.5 text-sm transition-all duration-200 rounded-lg group ${
              active 
                ? 'bg-gold-400/10 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Icon size={18} className={active ? 'text-gold-400' : 'text-neutral-500 group-hover:text-white'} />
              {label}
            </div>
            <ChevronRight size={14} className={active ? 'opacity-50 text-gold-400' : 'opacity-50 group-hover:text-white'} />
          </Link>
        );
      })}
      <button
        onClick={async () => { await signOut(); navigate('/'); }}
        className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm text-neutral-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200 mt-2"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </nav>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmModal({ 
  onConfirm, 
  onCancel, 
  isDeleting,
  itemLabel = 'Address',
}: { 
  onConfirm: () => void; 
  onCancel: () => void;
  isDeleting: boolean;
  itemLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-2xl animate-scale-up">
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={36} className="text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">Delete {itemLabel}</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Are you sure you want to delete this {itemLabel.toLowerCase()}?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border-2 border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 ${
                isDeleting 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:bg-red-600 hover:shadow-red-500/40'
              }`}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Order Modal Component
function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [shipping, setShipping] = useState({
    full_name: order.shipping_address?.full_name ?? '',
    phone: order.shipping_address?.phone ?? '',
    address_line1: order.shipping_address?.address_line1 ?? '',
    address_line2: order.shipping_address?.address_line2 ?? '',
    city: order.shipping_address?.city ?? '',
    postal_code: order.shipping_address?.postal_code ?? '',
    country: order.shipping_address?.country ?? 'LE',
  });
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadItems = async () => {
      const orderItems = order.order_items ?? [];
      const productIds = orderItems.map(i => i.product_id);
      const { data: products } = productIds.length > 0
        ? await supabase.from('products').select('id, stock_quantity, sizes, price').in('id', productIds)
        : { data: [] };

      const stockMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p.stock_quantity]));
      const sizesMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p.sizes || []]));
      const basePriceMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p.price || 0]));

      setItems(
        orderItems.map(item => {
          const currentStock = stockMap[item.product_id] ?? 0;
          const availableSizes = sizesMap[item.product_id] || [];
          const basePrice = basePriceMap[item.product_id] || 0;
          
          const selectedSize = availableSizes.find((s: any) => s.label === item.size);
          const itemPrice = selectedSize ? selectedSize.price : basePrice;
          
          return {
            id: item.id,
            product_id: item.product_id,
            name: (item as any).products?.name ?? 'Product',
            image: (item as any).products?.image_urls?.[0] ?? '',
            price: itemPrice,
            originalPrice: item.price,
            quantity: item.quantity,
            originalQuantity: item.quantity,
            maxQuantity: currentStock + item.quantity,
            size: item.size || null,
            availableSizes: availableSizes,
            basePrice: basePrice,
          };
        })
      );
      setLoadingItems(false);
    };
    loadItems();
  }, [order]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, Math.min(item.maxQuantity, item.quantity + delta)) }
          : item
      )
    );
  };

  const updateSize = (itemId: string, size: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const selectedSize = item.availableSizes.find((s: any) => s.label === size);
          const newPrice = selectedSize ? selectedSize.price : item.basePrice;
          return {
            ...item,
            size: size === '—' ? null : size,
            price: newPrice,
          };
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 4;
  const total = subtotal - (order.discount_amount ?? 0) + shippingCost;

  const validateField = (field: keyof typeof shipping, value: string) => {
    if (!value.trim()) return `${field.replace('_', ' ').toUpperCase()} is required`;
    if (field === 'full_name' && !/^[a-zA-Z\s]+$/.test(value.trim())) return 'Only letters and spaces allowed';
    if (field === 'phone' && !/^\d{8}$/.test(value.trim())) return 'Must be exactly 8 digits';
    if (field === 'full_name' && value.trim().length > 20) return 'Maximum 20 characters';
    if ((field === 'address_line1' || field === 'address_line2') && value.trim().length > 30) return 'Maximum 30 characters';
    if (field === 'city' && !/^[a-zA-Z\s]+$/.test(value.trim())) return 'Only letters and spaces allowed';
    if (field === 'city' && value.trim().length > 20) return 'Maximum 20 characters';
    if (field === 'postal_code' && value.trim() && !/^\d{4}$/.test(value.trim())) return 'Must be exactly 4 digits';
    return '';
  };

  const handleShippingChange = (field: keyof typeof shipping, value: string) => {
    let processedValue = value;
    if (field === 'full_name' || field === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }
    if (field === 'phone' || field === 'postal_code') {
      processedValue = value.replace(/\D/g, '');
    }
    setShipping(prev => ({ ...prev, [field]: processedValue }));
    const error = validateField(field, processedValue);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const requiredFields: (keyof typeof shipping)[] = ['full_name', 'phone', 'address_line1', 'city', 'country'];
  const isValid = requiredFields.every(f => {
    const value = shipping[f]?.toString().trim() || '';
    return value && !fieldErrors[f];
  });

  const handleSave = async () => {
    setError('');
    
    let hasError = false;
    const newErrors: Record<string, string> = {};
    for (const field of requiredFields) {
      const value = shipping[field]?.toString().trim() || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    }
    setFieldErrors(newErrors);
    
    if (hasError) {
      setError('Please fix all validation errors before saving.');
      return;
    }

    setSaving(true);

    try {
      for (const item of items) {
        const diff = item.quantity - item.originalQuantity;
        if (diff !== 0) {
          const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (fetchError || !product) throw new Error('Failed to verify stock. Please try again.');

          const newStock = product.stock_quantity - diff;
          if (newStock < 0) throw new Error('Not enough stock available for the selected quantity.');

          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          if (stockError) throw stockError;
        }

        const { error: itemError } = await supabase
          .from('order_items')
          .update({ 
            quantity: item.quantity,
            size: item.size || null,
            price: item.price
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          shipping_address: shipping,
          total_amount: total,
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-neutral-900 max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/10 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-neutral-900 border-b border-white/10 px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-serif font-light text-white">
              Edit Order <span className="text-gold-400">#{order.order_number}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Update items, sizes and shipping details</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <X size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-gold-400" />
              <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Items</h4>
              <span className="ml-auto text-xs text-neutral-500">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {loadingItems ? (
              <div className="space-y-3">
                {Array(2).fill(null).map((_, i) => (
                  <div key={i} className="h-20 bg-neutral-800/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => {
                  return (
                    <div key={item.id} className="bg-neutral-800/30 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:border-white/10 transition-all duration-200">
                      <div className="w-16 h-20 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-neutral-400">${item.price.toFixed(2)} each</p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-neutral-500">Size:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.availableSizes && item.availableSizes.length > 0 ? (
                              <>
                                {item.availableSizes.map((s: any) => (
                                  <button
                                    key={s.label}
                                    onClick={() => updateSize(item.id, s.label)}
                                    className={`px-2.5 py-0.5 text-xs font-medium rounded-md border transition-all duration-200 ${
                                      item.size === s.label
                                        ? 'bg-gold-400 text-neutral-900 border-gold-400'
                                        : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:bg-white/10'
                                    }`}
                                  >
                                    {s.label} ${s.price.toFixed(0)}
                                  </button>
                                ))}
                              </>
                            ) : (
                              <span className="text-xs text-neutral-500">No sizes available</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-neutral-800 border border-white/10 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-l-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm text-white font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.quantity >= item.maxQuantity}
                            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-r-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gold-400 w-20 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-gold-400" />
              <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Shipping Address</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <input
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldErrors.full_name 
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                      : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                  }`}
                  placeholder="Full Name * (max 20 chars, letters only)"
                  value={shipping.full_name}
                  onChange={e => handleShippingChange('full_name', e.target.value)}
                  maxLength={20}
                />
                {fieldErrors.full_name && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {fieldErrors.full_name}
                  </p>
                )}
                {!fieldErrors.full_name && shipping.full_name && (
                  <p className="mt-1.5 text-xs text-neutral-500">{shipping.full_name.trim().length}/20 characters</p>
                )}
              </div>

              <div className="md:col-span-2">
                <input
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldErrors.phone 
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                      : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                  }`}
                  placeholder="Phone Number * (8 digits)"
                  value={shipping.phone}
                  onChange={e => handleShippingChange('phone', e.target.value)}
                  maxLength={8}
                  inputMode="numeric"
                />
                {fieldErrors.phone && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {fieldErrors.phone}
                  </p>
                )}
                {!fieldErrors.phone && shipping.phone && (
                  <p className="mt-1.5 text-xs text-neutral-500">{shipping.phone.length}/8 digits</p>
                )}
              </div>

              <div className="md:col-span-2">
                <input
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldErrors.address_line1 
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                      : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                  }`}
                  placeholder="Address Line 1 * (max 30 chars)"
                  value={shipping.address_line1}
                  onChange={e => handleShippingChange('address_line1', e.target.value)}
                  maxLength={30}
                />
                {fieldErrors.address_line1 && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {fieldErrors.address_line1}
                  </p>
                )}
                {!fieldErrors.address_line1 && shipping.address_line1 && (
                  <p className="mt-1.5 text-xs text-neutral-500">{shipping.address_line1.length}/30 characters</p>
                )}
              </div>

              <div className="md:col-span-2">
                <input
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldErrors.address_line2 
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                      : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                  }`}
                  placeholder="Address Line 2 (max 30 chars, optional)"
                  value={shipping.address_line2}
                  onChange={e => handleShippingChange('address_line2', e.target.value)}
                  maxLength={30}
                />
                {fieldErrors.address_line2 && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {fieldErrors.address_line2}
                  </p>
                )}
                {!fieldErrors.address_line2 && shipping.address_line2 && (
                  <p className="mt-1.5 text-xs text-neutral-500">{shipping.address_line2.length}/30 characters</p>
                )}
              </div>

              <div>
                <input
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldErrors.city 
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                      : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                  }`}
                  placeholder="City * (max 20 chars, letters only)"
                  value={shipping.city}
                  onChange={e => handleShippingChange('city', e.target.value)}
                  maxLength={20}
                />
                {fieldErrors.city && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {fieldErrors.city}
                  </p>
                )}
                {!fieldErrors.city && shipping.city && (
                  <p className="mt-1.5 text-xs text-neutral-500">{shipping.city.trim().length}/20 characters</p>
                )}
              </div>

              <div>
                <input
                  className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldErrors.postal_code 
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                      : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                  }`}
                  placeholder="Postal Code (4 digits, optional)"
                  value={shipping.postal_code}
                  onChange={e => handleShippingChange('postal_code', e.target.value)}
                  maxLength={4}
                  inputMode="numeric"
                />
                {fieldErrors.postal_code && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {fieldErrors.postal_code}
                  </p>
                )}
                {!fieldErrors.postal_code && shipping.postal_code && (
                  <p className="mt-1.5 text-xs text-neutral-500">{shipping.postal_code.length}/4 digits</p>
                )}
              </div>

              <div className="md:col-span-2">
                <select
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 transition-all duration-200 text-sm [&>option]:bg-neutral-900 [&>option]:text-white"
                  value={shipping.country}
                  onChange={e => setShipping(prev => ({ ...prev, country: e.target.value }))}
                >
                  <option value="LE" className="bg-neutral-900 text-white">🇱🇧 Lebanon</option>
                  <option value="US" className="bg-neutral-900 text-white">🇺🇸 United States</option>
                  <option value="UK" className="bg-neutral-900 text-white">🇬🇧 United Kingdom</option>
                  <option value="CA" className="bg-neutral-900 text-white">🇨🇦 Canada</option>
                  <option value="FR" className="bg-neutral-900 text-white">🇫🇷 France</option>
                  <option value="DE" className="bg-neutral-900 text-white">🇩🇪 Germany</option>
                  <option value="IT" className="bg-neutral-900 text-white">🇮🇹 Italy</option>
                  <option value="ES" className="bg-neutral-900 text-white">🇪🇸 Spain</option>
                  <option value="AE" className="bg-neutral-900 text-white">🇦🇪 UAE</option>
                  <option value="SA" className="bg-neutral-900 text-white">🇸🇦 Saudi Arabia</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Order Summary</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              {(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-gold-400">
                  <span>Discount</span>
                  <span>−${(order.discount_amount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-400">Shipping</span>
                <span className="text-white">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-gold-400 text-lg font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-white/10 text-neutral-400 rounded-xl font-medium hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingItems || !isValid}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-400/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [originalFullName, setOriginalFullName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setOriginalFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setOriginalPhone(profile.phone ?? '');
    }
  }, [profile]);

  const hasChanges = fullName.trim() !== originalFullName.trim() || phone !== originalPhone;

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Full Name is required';
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Name can only contain letters and spaces';
    if (name.trim().length > 20) return 'Name must be 20 characters or less';
    return undefined;
  };

  const validatePhone = (phone: string): boolean => {
    return /^\d{8}$/.test(phone);
  };

  const handleNameChange = (value: string) => {
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
    const limited = lettersOnly.slice(0, 20);
    setFullName(limited);
    setNameError('');
  };

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    const limited = numbersOnly.slice(0, 8);
    setPhone(limited);
    setPhoneError('');
    
    if (limited.length > 0 && limited.length < 8) {
      setPhoneError('Phone number must be exactly 8 digits');
    } else if (limited.length === 8) {
      setPhoneError('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const nameErrorMsg = validateName(fullName);
    if (nameErrorMsg) {
      setNameError(nameErrorMsg);
      return;
    }
    
    if (phone && !validatePhone(phone)) {
      setPhoneError('Phone number must be exactly 8 digits');
      return;
    }
    
    setSaving(true);

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim(), phone: phone || null })
      .eq('id', profile.id);
    
    if (!error) {
      await refreshProfile();
      setOriginalFullName(fullName.trim());
      setOriginalPhone(phone);
      setSaving(false);
      setSuccessMessage('Profile updated successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setSaving(false);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div>
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-200 border border-green-600 rounded-lg text-sm text-green-600 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={18} className="text-green-600" />
          {successMessage}
        </div>
      )}
      
      <h2 className="text-2xl font-light text-white mb-8">Profile</h2>
      <form onSubmit={handleSave} className="max-w-md space-y-4">
        <div>
          <input 
            value={fullName} 
            onChange={e => handleNameChange(e.target.value)} 
            placeholder="Full Name (max 20 characters)" 
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 ${
              nameError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
            }`}
            maxLength={20}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-500">{nameError}</p>
          )}
          {!nameError && fullName && (
            <p className="mt-1 text-xs text-neutral-500">{fullName.trim().length}/20 characters</p>
          )}
        </div>
        
        <input 
          value={profile?.email ?? ''} 
          disabled 
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 cursor-not-allowed focus:outline-none"
        />
        
        <div>
          <input 
            value={phone} 
            onChange={e => handlePhoneChange(e.target.value)} 
            placeholder="Phone Number (8 digits)" 
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 ${
              phoneError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
            }`}
            maxLength={8}
            inputMode="numeric"
          />
          {phoneError && (
            <p className="mt-1 text-xs text-red-500">{phoneError}</p>
          )}
          {!phoneError && phone && (
            <p className="mt-1 text-xs text-neutral-500">{phone.length}/8 digits</p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={saving || !hasChanges || !!nameError || !!phoneError} 
          className={`w-full py-3 px-4 bg-gold-400 text-neutral-900 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            saving || !hasChanges || nameError || phoneError 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gold-300 hover:shadow-lg hover:shadow-gold-400/20'
          }`}
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
        
        {!hasChanges && !saving && (
          <p className="text-xs text-neutral-500 text-center">No changes to save</p>
        )}
      </form>
    </div>
  );
}

function OrdersTab() {
  const { authUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

 const loadOrders = () => {
  if (!authUser) return;
  supabase
    .from('orders')
    .select('*, order_items(*, products(name, image_urls, sizes))')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false }) // NEWEST FIRST
    .then(({ data }) => {
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    });
};

  useEffect(() => {
    loadOrders();
  }, [authUser]);

  const handleDelete = async (orderId: string) => {
    setIsDeleting(true);

    const order = orders.find(o => o.id === orderId);
    if (order?.order_items) {
      for (const item of order.order_items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity + item.quantity })
            .eq('id', item.product_id);
        }
      }
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error deleting order items:', itemsError);
      setIsDeleting(false);
      alert('Failed to delete order. Please try again.');
      return;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      console.error('Error deleting order:', orderError);
      setIsDeleting(false);
      alert('Failed to delete order. Please try again.');
      return;
    }

    setDeleteId(null);
    setIsDeleting(false);
    setSuccessMessage('Order deleted successfully');
    setShowSuccess(true);
    loadOrders();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleEditSaved = () => {
    setSuccessMessage('Order updated successfully');
    setShowSuccess(true);
    loadOrders();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Status configuration with icons
  const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: {
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
      icon: <Clock size={13} className="text-yellow-400" />,
      label: 'Pending'
    },
    processing: {
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      icon: <RefreshCw size={13} className="text-blue-400" />,
      label: 'Processing'
    },
    shipped: {
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
      icon: <Truck size={13} className="text-purple-400" />,
      label: 'Shipped'
    },
    delivered: {
      color: 'bg-green-500/20 text-green-400 border-green-500/20',
      icon: <CheckCircle size={13} className="text-green-400" />,
      label: 'Delivered'
    },
    cancelled: {
      color: 'bg-red-500/20 text-red-400 border-red-500/20',
      icon: <X size={13} className="text-red-400" />,
      label: 'Cancelled'
    },
  };

  return (
    <div>
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-200 border border-green-600 rounded-lg text-sm text-green-600 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={18} className="text-green-600" />
          {successMessage}
        </div>
      )}

      <h2 className="text-2xl font-light text-white mb-8">Order History</h2>
      {loading ? (
        <div className="space-y-4">{Array(3).fill(null).map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p>No orders yet</p>
          <Link to="/shop" className="inline-block mt-6 px-6 py-3 bg-gold-400 text-neutral-900 rounded-xl font-medium hover:bg-gold-300 transition-all duration-200">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Product</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Size</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Qty</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Total</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const firstItem = order.order_items?.[0];
                const size = firstItem?.size || '—';
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

                return (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">#{order.order_number}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex gap-1.5">
                        {order.order_items?.slice(0, 3).map(item => (
                          <div key={item.id} className="w-10 h-12 bg-white/5 rounded-md overflow-hidden">
                            <img src={(item as any).products?.image_urls?.[0] ?? ''} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {(order.order_items?.length ?? 0) > 3 && (
                          <div className="w-10 h-12 bg-white/5 rounded-md flex items-center justify-center text-[10px] text-neutral-500">
                            +{(order.order_items?.length ?? 0) - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gold-400/10 text-gold-400 text-xs font-medium border border-gold-400/20">
                        {size}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-neutral-400">
                      {new Date(order.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-4 text-center text-neutral-300">
                      {order.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-white">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {order.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => setEditOrder(order)}
                              className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                              title="Edit order"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteId(order.id)}
                              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                              title="Delete order"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-neutral-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
          isDeleting={isDeleting}
          itemLabel="Order"
        />
      )}

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}

function WishlistTab() {
  const { authUser } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    supabase
      .from('wishlist')
      .select('*, products(*, categories(*))')
      .eq('user_id', authUser.id)
      .then(({ data }) => {
        setWishlist((data as WishlistItem[]) ?? []);
        setLoading(false);
      });
  }, [authUser]);

  return (
    <div>
      <h2 className="text-2xl font-light text-white mb-8">Wishlist</h2>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">{Array(3).fill(null).map((_, i) => <div key={i} className="aspect-[3/4] bg-white/5 animate-pulse rounded-xl" />)}</div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Heart size={48} className="mx-auto mb-4 opacity-30" />
          <p>No saved items</p>
          <Link to="/shop" className="inline-block mt-6 px-6 py-3 bg-gold-400 text-neutral-900 rounded-xl font-medium hover:bg-gold-300 transition-all duration-200">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map(item => item.products && (
            <ProductCard key={item.id} product={item.products} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressesTab() {
  const { authUser } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForms, setEditForms] = useState<Record<string, any>>({});
  const [originalForms, setOriginalForms] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({});

  const loadAddresses = async () => {
    if (!authUser) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', authUser.id);
    setAddresses(data ?? []);
    
    if (data) {
      const forms: Record<string, any> = {};
      const originals: Record<string, any> = {};
      const errors: Record<string, any> = {};
      data.forEach((addr: any) => {
        forms[addr.id] = {
          full_name: addr.full_name || '',
          phone: addr.phone || '',
          address_line1: addr.address_line1 || '',
          address_line2: addr.address_line2 || '',
          city: addr.city || '',
          postal_code: addr.postal_code || '',
          country: addr.country || 'LE',
        };
        originals[addr.id] = {
          full_name: addr.full_name || '',
          phone: addr.phone || '',
          address_line1: addr.address_line1 || '',
          address_line2: addr.address_line2 || '',
          city: addr.city || '',
          postal_code: addr.postal_code || '',
          country: addr.country || 'LE',
        };
        errors[addr.id] = {
          full_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          postal_code: '',
        };
      });
      setEditForms(forms);
      setOriginalForms(originals);
      setFieldErrors(errors);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadAddresses();
  }, [authUser]);

  const validateFullName = (value: string) => {
    if (!value.trim()) return 'Full Name is required';
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Only letters and spaces allowed';
    if (value.trim().length > 20) return 'Maximum 20 characters';
    return '';
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return 'Phone number is required';
    if (!/^\d{8}$/.test(value.trim())) return 'Must be exactly 8 digits';
    return '';
  };

  const validateAddressLine = (value: string, fieldName: string) => {
    if (!value.trim()) return `${fieldName} is required`;
    if (value.trim().length > 30) return 'Maximum 30 characters';
    return '';
  };

  const validateCity = (value: string) => {
    if (!value.trim()) return 'City is required';
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Only letters and spaces allowed';
    if (value.trim().length > 20) return 'Maximum 20 characters';
    return '';
  };

  const validatePostalCode = (value: string) => {
    if (value.trim() && !/^\d{4}$/.test(value.trim())) return 'Must be exactly 4 digits';
    return '';
  };

  const validateForm = (addressId: string) => {
    const form = editForms[addressId];
    const errors = {
      full_name: validateFullName(form.full_name),
      phone: validatePhone(form.phone),
      address_line1: validateAddressLine(form.address_line1, 'Address Line 1'),
      address_line2: form.address_line2.trim() ? validateAddressLine(form.address_line2, 'Address Line 2') : '',
      city: validateCity(form.city),
      postal_code: validatePostalCode(form.postal_code),
    };
    setFieldErrors(prev => ({ ...prev, [addressId]: errors }));
    return !Object.values(errors).some(error => error !== '');
  };

  const hasChanges = (addressId: string) => {
    const form = editForms[addressId];
    const original = originalForms[addressId];
    if (!form || !original) return false;
    return (
      form.full_name !== original.full_name ||
      form.phone !== original.phone ||
      form.address_line1 !== original.address_line1 ||
      form.address_line2 !== original.address_line2 ||
      form.city !== original.city ||
      form.postal_code !== original.postal_code ||
      form.country !== original.country
    );
  };

  const handleFieldChange = (addressId: string, field: string, value: string) => {
    setEditForms(prev => ({
      ...prev,
      [addressId]: { ...prev[addressId], [field]: value }
    }));
    if (fieldErrors[addressId]?.[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [addressId]: { ...prev[addressId], [field]: '' }
      }));
    }
  };

  const handleSaveAddress = async (addressId: string) => {
    if (!validateForm(addressId)) return;
    
    setSaving(true);
    const form = editForms[addressId];

    const { error } = await supabase
      .from('addresses')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim(),
        postal_code: form.postal_code.trim() || null,
        country: form.country,
      })
      .eq('id', addressId);

    if (!error) {
      setSuccessMessage('Address updated successfully');
      setShowSuccess(true);
      setOriginalForms(prev => ({
        ...prev,
        [addressId]: { ...form }
      }));
      await loadAddresses();
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert('Failed to update address. Please try again.');
    }

    setSaving(false);
  };

  const handleDelete = async (addressId: string) => {
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (!error) {
      setDeleteId(null);
      setIsDeleting(false);
      setSuccessMessage('Address deleted successfully');
      setShowSuccess(true);
      await loadAddresses();
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setIsDeleting(false);
      alert('Failed to delete address. Please try again.');
    }
  };

  return (
    <div>
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-200 border border-green-600 rounded-lg text-sm text-green-600 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={18} className="text-green-600" />
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light text-white">Saved Address</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(2).fill(null).map((_, i) => (
            <div key={i} className="h-52 bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
          <MapPin size={56} className="mx-auto mb-4 opacity-30 text-neutral-500" />
          <p className="text-neutral-400 font-medium">No saved addresses yet</p>
          <p className="text-sm text-neutral-500 mt-1">Add an address during checkout</p>
        </div>
      ) : (
        <div className="space-y-6">
          {addresses.map((addr) => {
            const form = editForms[addr.id] || {};
            const errors = fieldErrors[addr.id] || {};
            const hasChangesForAddress = hasChanges(addr.id);

            return (
              <div key={addr.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm ${
                        errors.full_name ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
                      }`}
                      placeholder="Full Name * (max 20 chars, letters only)"
                      value={form.full_name || ''}
                      onChange={e => handleFieldChange(addr.id, 'full_name', e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20))}
                      maxLength={20}
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
                    )}
                    {!errors.full_name && form.full_name && (
                      <p className="mt-1 text-xs text-neutral-500">{form.full_name.trim().length}/20 characters</p>
                    )}
                  </div>

                  <div>
                    <input
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm ${
                        errors.phone ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
                      }`}
                      placeholder="Phone Number * (8 digits)"
                      value={form.phone || ''}
                      onChange={e => handleFieldChange(addr.id, 'phone', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      maxLength={8}
                      inputMode="numeric"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                    )}
                    {!errors.phone && form.phone && (
                      <p className="mt-1 text-xs text-neutral-500">{form.phone.length}/8 digits</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <input
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm ${
                        errors.address_line1 ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
                      }`}
                      placeholder="Address Line 1 * (max 30 chars)"
                      value={form.address_line1 || ''}
                      onChange={e => handleFieldChange(addr.id, 'address_line1', e.target.value.slice(0, 30))}
                      maxLength={30}
                    />
                    {errors.address_line1 && (
                      <p className="mt-1 text-xs text-red-500">{errors.address_line1}</p>
                    )}
                    {!errors.address_line1 && form.address_line1 && (
                      <p className="mt-1 text-xs text-neutral-500">{form.address_line1.length}/30 characters</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <input
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm ${
                        errors.address_line2 ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
                      }`}
                      placeholder="Address Line 2 (max 30 chars, optional)"
                      value={form.address_line2 || ''}
                      onChange={e => handleFieldChange(addr.id, 'address_line2', e.target.value.slice(0, 30))}
                      maxLength={30}
                    />
                    {errors.address_line2 && (
                      <p className="mt-1 text-xs text-red-500">{errors.address_line2}</p>
                    )}
                    {!errors.address_line2 && form.address_line2 && (
                      <p className="mt-1 text-xs text-neutral-500">{form.address_line2.length}/30 characters</p>
                    )}
                  </div>

                  <div>
                    <input
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm ${
                        errors.city ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
                      }`}
                      placeholder="City * (max 20 chars, letters only)"
                      value={form.city || ''}
                      onChange={e => handleFieldChange(addr.id, 'city', e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20))}
                      maxLength={20}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                    )}
                    {!errors.city && form.city && (
                      <p className="mt-1 text-xs text-neutral-500">{form.city.trim().length}/20 characters</p>
                    )}
                  </div>

                  <div>
                    <input
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm ${
                        errors.postal_code ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-gold-400'
                      }`}
                      placeholder="Postal Code (4 digits, optional)"
                      value={form.postal_code || ''}
                      onChange={e => handleFieldChange(addr.id, 'postal_code', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      inputMode="numeric"
                    />
                    {errors.postal_code && (
                      <p className="mt-1 text-xs text-red-500">{errors.postal_code}</p>
                    )}
                    {!errors.postal_code && form.postal_code && (
                      <p className="mt-1 text-xs text-neutral-500">{form.postal_code.length}/4 digits</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <select
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-200 text-sm [&>option]:bg-neutral-900 [&>option]:text-white"
                      value={form.country || 'LE'}
                      onChange={e => handleFieldChange(addr.id, 'country', e.target.value)}
                    >
                      <option value="LE" className="bg-neutral-900 text-white">Lebanon</option>
                      <option value="US" className="bg-neutral-900 text-white">United States</option>
                      <option value="UK" className="bg-neutral-900 text-white">United Kingdom</option>
                      <option value="CA" className="bg-neutral-900 text-white">Canada</option>
                      <option value="FR" className="bg-neutral-900 text-white">France</option>
                      <option value="DE" className="bg-neutral-900 text-white">Germany</option>
                      <option value="IT" className="bg-neutral-900 text-white">Italy</option>
                      <option value="ES" className="bg-neutral-900 text-white">Spain</option>
                      <option value="AE" className="bg-neutral-900 text-white">UAE</option>
                      <option value="SA" className="bg-neutral-900 text-white">Saudi Arabia</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleSaveAddress(addr.id)}
                    disabled={saving || !hasChangesForAddress}
                    className={`flex-1 py-2.5 px-4 bg-gold-400 text-neutral-900 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                      saving || !hasChangesForAddress ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gold-300'
                    }`}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(addr.id)}
                    className="flex-1 py-2.5 px-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-all duration-200 text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
                {!hasChangesForAddress && !saving && (
                  <p className="text-xs text-neutral-500 text-center mt-2">No changes to save</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
          isDeleting={isDeleting}
          itemLabel="Address"
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  const { authUser, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authUser) navigate('/login');
  }, [authUser, loading, navigate]);

  if (loading) return <div className="min-h-screen pt-28" />;
  if (!authUser) return null;

  return (
    <div className="min-h-screen pt-20 md:pt-28 pb-20 px-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="max-w-screen-xl mx-auto">
        <div className="py-10">
          <h1 className="font-serif text-3xl font-light text-white">My Account</h1>
          <p className="text-sm text-neutral-400 mt-1">Welcome back, {profile?.full_name ?? 'there'}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-10">
          <aside className="lg:col-span-1">
            <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-2 sticky top-28">
              <AccountNav />
            </div>
          </aside>
          <main className="lg:col-span-3">
            <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-8">
              <Routes>
                <Route path="/" element={<ProfileTab />} />
                <Route path="/orders" element={<OrdersTab />} />
                <Route path="/wishlist" element={<WishlistTab />} />
                <Route path="/addresses" element={<AddressesTab />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
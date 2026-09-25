import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, Edit2, MapPin, Truck, Shield, CreditCard, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { authUser, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [shipping, setShipping] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'LE',
  });

  const [originalShipping, setOriginalShipping] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'LE',
  });

  const shippingCost = 4;

  // First-order 10% discount
  const isDiscountEligible = !!profile && !profile.has_used_signup_discount;
  const discountAmount = isDiscountEligible ? subtotal * 0.1 : 0;
  const total = subtotal - discountAmount + shippingCost;

  // Validation functions
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

  const validateField = (field: keyof typeof shipping, value: string) => {
    switch (field) {
      case 'full_name': return validateFullName(value);
      case 'phone': return validatePhone(value);
      case 'address_line1': return validateAddressLine(value, 'Address Line 1');
      case 'address_line2': return value.trim() ? validateAddressLine(value, 'Address Line 2') : '';
      case 'city': return validateCity(value);
      case 'postal_code': return validatePostalCode(value);
      default: return '';
    }
  };

  const handleFieldChange = (field: keyof typeof shipping, value: string) => {
    let processedValue = value;
    
    if (field === 'full_name' || field === 'city') {
      processedValue = value.replace(/[^a-zA-Z\s]/g, '');
      if (field === 'full_name') processedValue = processedValue.slice(0, 20);
      if (field === 'city') processedValue = processedValue.slice(0, 20);
    }
    
    if (field === 'phone' || field === 'postal_code') {
      processedValue = value.replace(/\D/g, '');
      if (field === 'phone') processedValue = processedValue.slice(0, 8);
      if (field === 'postal_code') processedValue = processedValue.slice(0, 4);
    }

    if (field === 'address_line1' || field === 'address_line2') {
      processedValue = value.slice(0, 30);
    }

    setShipping(prev => ({ ...prev, [field]: processedValue }));
    
    const error = validateField(field, processedValue);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const hasChanges = 
    shipping.full_name !== originalShipping.full_name ||
    shipping.phone !== originalShipping.phone ||
    shipping.address_line1 !== originalShipping.address_line1 ||
    shipping.address_line2 !== originalShipping.address_line2 ||
    shipping.city !== originalShipping.city ||
    shipping.postal_code !== originalShipping.postal_code ||
    shipping.country !== originalShipping.country;

  const hasFormData = 
    shipping.full_name.trim() !== '' &&
    shipping.phone.trim() !== '' &&
    shipping.address_line1.trim() !== '' &&
    shipping.city.trim() !== '';

  const isFormValid = 
    hasFormData &&
    !validateFullName(shipping.full_name) &&
    !validatePhone(shipping.phone) &&
    !validateAddressLine(shipping.address_line1, 'Address Line 1') &&
    !validateCity(shipping.city) &&
    !validatePostalCode(shipping.postal_code);

  useEffect(() => {
    if (authUser) {
      loadSavedAddress();
    }
  }, [authUser]);

  const loadSavedAddress = async () => {
    if (!authUser) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', authUser.id)
        .limit(1);

      if (error) {
        console.error('Error loading address:', error);
        return;
      }

      if (data && data.length > 0) {
        const address = data[0];
        setSavedAddress(address);
        const addressData = {
          full_name: address.full_name || '',
          phone: address.phone || '',
          address_line1: address.address_line1 || '',
          address_line2: address.address_line2 || '',
          city: address.city || '',
          postal_code: address.postal_code || '',
          country: address.country || 'LE',
        };
        setShipping(addressData);
        setOriginalShipping(addressData);
        setIsEditing(false);
      } else {
        setSavedAddress(null);
        setShipping({
          full_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          postal_code: '',
          country: 'LE',
        });
        setOriginalShipping({
          full_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          postal_code: '',
          country: 'LE',
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading saved address:', error);
    }
  };

  const saveAddress = async (userId: string, addressData: typeof shipping, addressId?: string) => {
    try {
      if (addressId) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update({
            full_name: addressData.full_name.trim(),
            phone: addressData.phone.trim(),
            address_line1: addressData.address_line1.trim(),
            address_line2: addressData.address_line2.trim() || null,
            city: addressData.city.trim(),
            postal_code: addressData.postal_code.trim() || null,
            country: addressData.country,
          })
          .eq('id', addressId)
          .eq('user_id', userId);

        if (updateError) return false;
        return true;
      }

      const { data: existingAddresses, error: checkError } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('full_name', addressData.full_name.trim())
        .eq('address_line1', addressData.address_line1.trim())
        .eq('city', addressData.city.trim())
        .eq('country', addressData.country);

      if (checkError) return false;

      if (existingAddresses && existingAddresses.length > 0) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update({
            full_name: addressData.full_name.trim(),
            phone: addressData.phone.trim(),
            address_line1: addressData.address_line1.trim(),
            address_line2: addressData.address_line2.trim() || null,
            city: addressData.city.trim(),
            postal_code: addressData.postal_code.trim() || null,
            country: addressData.country,
          })
          .eq('id', existingAddresses[0].id);

        if (updateError) return false;
        return true;
      }

      const { error: insertError } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          full_name: addressData.full_name.trim(),
          phone: addressData.phone.trim(),
          address_line1: addressData.address_line1.trim(),
          address_line2: addressData.address_line2.trim() || null,
          city: addressData.city.trim(),
          postal_code: addressData.postal_code.trim() || null,
          country: addressData.country,
        });

      if (insertError) return false;
      return true;
    } catch (error) {
      console.error('Failed to save address:', error);
      return false;
    }
  };

  const handleSaveAddress = async () => {
    if (!authUser) return;
    setSavingAddress(true);

    // Validate all fields before saving
    const errors: Record<string, string> = {};
    let hasError = false;
    
    const fullNameError = validateFullName(shipping.full_name);
    if (fullNameError) { errors.full_name = fullNameError; hasError = true; }
    
    const phoneError = validatePhone(shipping.phone);
    if (phoneError) { errors.phone = phoneError; hasError = true; }
    
    const addressError = validateAddressLine(shipping.address_line1, 'Address Line 1');
    if (addressError) { errors.address_line1 = addressError; hasError = true; }
    
    const cityError = validateCity(shipping.city);
    if (cityError) { errors.city = cityError; hasError = true; }
    
    const postalError = validatePostalCode(shipping.postal_code);
    if (postalError) { errors.postal_code = postalError; hasError = true; }
    
    setFieldErrors(errors);
    
    if (hasError) {
      setSavingAddress(false);
      return;
    }

    const success = await saveAddress(authUser.id, shipping, savedAddress?.id);
    
    if (success) {
      setOriginalShipping({ ...shipping });
      setIsEditing(false);
      await loadSavedAddress();
    } else {
      alert('Failed to save address. Please try again.');
    }
    
    setSavingAddress(false);
  };

  const handleCancelEdit = () => {
    if (savedAddress) {
      setShipping({ ...originalShipping });
      setIsEditing(false);
      setFieldErrors({});
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) { 
      navigate('/register'); 
      return; 
    }
    setLoading(true);

    try {
      for (const item of items) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product.id)
          .single();

        if (error) {
          throw new Error(`Failed to fetch product: ${error.message}`);
        }

        if (product.stock_quantity < item.quantity) {
          alert(`Not enough stock for "${product.name}". Available: ${product.stock_quantity}`);
          setLoading(false);
          return;
        }
      }

      let appliedDiscount = 0;
      if (authUser) {
        const { data: freshProfile, error: profileError } = await supabase
          .from('users')
          .select('has_used_signup_discount')
          .eq('id', authUser.id)
          .single();

        if (!profileError && freshProfile && !freshProfile.has_used_signup_discount) {
          appliedDiscount = subtotal * 0.1;
        }
      }
      const finalTotal = subtotal - appliedDiscount + shippingCost;

      const orderData: any = {
        user_id: authUser.id,
        total_amount: finalTotal,
        discount_amount: appliedDiscount,
        status: 'pending',
        payment_status: 'paid',
        shipping_address: shipping,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price,
        size: item.size || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      for (const item of items) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product.id)
          .single();

        if (fetchError) throw fetchError;

        const newStock = product.stock_quantity - item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id);

        if (updateError) throw updateError;
      }

      if (!savedAddress || hasChanges) {
        const addressSaved = await saveAddress(authUser.id, shipping, savedAddress?.id);
        if (!addressSaved) {
          console.warn('Order placed successfully, but the shipping address could not be saved for next time.');
        }
      }

      if (appliedDiscount > 0) {
        const { error: flagError } = await supabase
          .from('users')
          .update({ has_used_signup_discount: true })
          .eq('id', authUser.id);

        if (flagError) {
          console.error('Failed to mark discount as used:', flagError);
        } else {
          await refreshProfile();
        }
      }

      const orderRef = order.order_number;
      setOrderNumber(orderRef);

      const itemsHtml = items
        .map(
          item => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee">
                ${item.product.name}${item.size ? ` (${item.size})` : ''}
              </td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">×${item.quantity}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">
                $${(item.price * item.quantity).toFixed(2)}
              </td>
            </tr>`
        )
        .join('');

      const { data: adminUser } = await supabase
        .from('users')
        .select('email')
        .eq('role', 'admin')
        .single();

      await fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: authUser.email,
          adminEmail: adminUser?.email ?? null,
          orderRef,
          shipping,
          itemsHtml,
          subtotal: subtotal.toFixed(2),
          discount: appliedDiscount.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          total: finalTotal.toFixed(2),
        }),
      });

      clearCart();
      setShowConfirmation(true);

    } catch (error) {
      console.error('Error placing order:', error);
      let errorMessage = 'Failed to place order. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Failed to place order: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !showConfirmation) {
    navigate('/cart');
    return null;
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pt-28 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-3">Order Confirmed!</h1>
          <p className="text-neutral-400 mb-2">Thank you for your purchase.</p>
          <p className="text-sm text-neutral-500 mb-8">
            Order <span className="text-gold-400 font-medium">#{orderNumber}</span> · A confirmation email has been sent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/account/orders')} 
              className="px-8 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
            >
              Track Order
            </button>
            <button 
              onClick={() => navigate('/shop')} 
              className="px-8 py-3 border border-white/10 text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pt-20 md:pt-28 pb-20 px-4">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="py-8 border-b border-white/5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold-400 mb-1">Secure Checkout</p>
              <h1 className="font-serif text-3xl md:text-4xl font-light text-white">Complete Your Order</h1>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500">
              <Shield size={14} className="text-gold-400" />
              Secured by SSL
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Contact Information */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gold-400 rounded-full" />
                    <h2 className="font-serif text-xl font-light text-white">Shipping Address</h2>
                  </div>
                  {savedAddress && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1 transition-colors duration-200"
                    >
                      <Edit2 size={14} />
                      Edit Address
                    </button>
                  )}
                </div>

                {isEditing || !savedAddress ? (
                  <div className="space-y-4">
                    <div>
                      <input
                        className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.full_name 
                            ? 'border-red-500/50 focus:ring-red-500/30' 
                            : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                        }`}
                        placeholder="Full Name * (max 20 chars, letters only)"
                        value={shipping.full_name}
                        onChange={e => handleFieldChange('full_name', e.target.value)}
                        maxLength={20}
                      />
                      {fieldErrors.full_name && (
                        <p className="mt-1.5 text-xs text-red-400">{fieldErrors.full_name}</p>
                      )}
                      {!fieldErrors.full_name && shipping.full_name && (
                        <p className="mt-1.5 text-xs text-neutral-500">{shipping.full_name.trim().length}/20 characters</p>
                      )}
                    </div>

                    <div>
                      <input
                        className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.phone 
                            ? 'border-red-500/50 focus:ring-red-500/30' 
                            : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                        }`}
                        placeholder="Phone Number * (8 digits)"
                        value={shipping.phone}
                        onChange={e => handleFieldChange('phone', e.target.value)}
                        maxLength={8}
                        inputMode="numeric"
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1.5 text-xs text-red-400">{fieldErrors.phone}</p>
                      )}
                      {!fieldErrors.phone && shipping.phone && (
                        <p className="mt-1.5 text-xs text-neutral-500">{shipping.phone.length}/8 digits</p>
                      )}
                    </div>

                    <div>
                      <input
                        className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.address_line1 
                            ? 'border-red-500/50 focus:ring-red-500/30' 
                            : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                        }`}
                        placeholder="Address Line 1 * (max 30 chars)"
                        value={shipping.address_line1}
                        onChange={e => handleFieldChange('address_line1', e.target.value)}
                        maxLength={30}
                      />
                      {fieldErrors.address_line1 && (
                        <p className="mt-1.5 text-xs text-red-400">{fieldErrors.address_line1}</p>
                      )}
                      {!fieldErrors.address_line1 && shipping.address_line1 && (
                        <p className="mt-1.5 text-xs text-neutral-500">{shipping.address_line1.length}/30 characters</p>
                      )}
                    </div>

                    <div>
                      <input
                        className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.address_line2 
                            ? 'border-red-500/50 focus:ring-red-500/30' 
                            : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                        }`}
                        placeholder="Address Line 2 (max 30 chars, optional)"
                        value={shipping.address_line2}
                        onChange={e => handleFieldChange('address_line2', e.target.value)}
                        maxLength={30}
                      />
                      {fieldErrors.address_line2 && (
                        <p className="mt-1.5 text-xs text-red-400">{fieldErrors.address_line2}</p>
                      )}
                      {!fieldErrors.address_line2 && shipping.address_line2 && (
                        <p className="mt-1.5 text-xs text-neutral-500">{shipping.address_line2.length}/30 characters</p>
                      )}
                    </div>

                    <div>
                      <input
                        className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.city 
                            ? 'border-red-500/50 focus:ring-red-500/30' 
                            : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                        }`}
                        placeholder="City * (max 20 chars, letters only)"
                        value={shipping.city}
                        onChange={e => handleFieldChange('city', e.target.value)}
                        maxLength={20}
                      />
                      {fieldErrors.city && (
                        <p className="mt-1.5 text-xs text-red-400">{fieldErrors.city}</p>
                      )}
                      {!fieldErrors.city && shipping.city && (
                        <p className="mt-1.5 text-xs text-neutral-500">{shipping.city.trim().length}/20 characters</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          className={`w-full px-4 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                            fieldErrors.postal_code 
                              ? 'border-red-500/50 focus:ring-red-500/30' 
                              : 'border-white/10 focus:border-gold-400 focus:ring-gold-400/30 hover:border-white/20'
                          }`}
                          placeholder="Postal Code (4 digits, optional)"
                          value={shipping.postal_code}
                          onChange={e => handleFieldChange('postal_code', e.target.value)}
                          maxLength={4}
                          inputMode="numeric"
                        />
                        {fieldErrors.postal_code && (
                          <p className="mt-1.5 text-xs text-red-400">{fieldErrors.postal_code}</p>
                        )}
                        {!fieldErrors.postal_code && shipping.postal_code && (
                          <p className="mt-1.5 text-xs text-neutral-500">{shipping.postal_code.length}/4 digits</p>
                        )}
                      </div>

                      <select
                        className="w-full px-4 py-3 bg-neutral-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 transition-all duration-200 [&>option]:bg-neutral-900 [&>option]:text-white"
                        value={shipping.country}
                        onChange={e => setShipping(s => ({ ...s, country: e.target.value }))}
                      >
                        <option value="LE">🇱🇧 Lebanon</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="UK">🇬🇧 United Kingdom</option>
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="FR">🇫🇷 France</option>
                        <option value="DE">🇩🇪 Germany</option>
                        <option value="IT">🇮🇹 Italy</option>
                        <option value="ES">🇪🇸 Spain</option>
                        <option value="AE">🇦🇪 UAE</option>
                        <option value="SA">🇸🇦 Saudi Arabia</option>
                      </select>
                    </div>

                    {savedAddress && isEditing && (
                      <div className="flex gap-3 mt-4">
                        <button
                          type="button"
                          onClick={handleSaveAddress}
                          disabled={savingAddress || !hasChanges}
                          className={`flex-1 py-3 px-4 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            savingAddress || !hasChanges 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:shadow-lg hover:shadow-gold-400/30 hover:scale-[1.02]'
                          }`}
                        >
                          {savingAddress ? (
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
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 py-3 px-4 border border-white/10 text-neutral-400 rounded-xl font-medium hover:bg-white/5 hover:text-white transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {savedAddress && isEditing && !hasChanges && !savingAddress && (
                      <p className="text-xs text-neutral-500 text-center">No changes to save</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-neutral-800/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-gold-400/20 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center shrink-0 border border-gold-400/20">
                        <MapPin size={18} className="text-gold-400" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="font-medium text-white">{savedAddress.full_name}</p>
                        <p className="text-sm text-neutral-400">{savedAddress.phone}</p>
                        <p className="text-sm text-neutral-400">{savedAddress.address_line1}</p>
                        {savedAddress.address_line2 && (
                          <p className="text-sm text-neutral-400">{savedAddress.address_line2}</p>
                        )}
                        <p className="text-sm text-neutral-400">
                          {savedAddress.city}
                          {savedAddress.postal_code && `, ${savedAddress.postal_code}`}
                        </p>
                        <p className="text-sm text-neutral-400">
                          {savedAddress.country === 'LE' ? 'Lebanon' : savedAddress.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gold-400 rounded-full" />
                  <h2 className="font-serif text-xl font-light text-white">Shipping Method</h2>
                </div>
                <div className="bg-neutral-800/30 border border-white/5 rounded-xl p-4 hover:border-gold-400/20 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck size={18} className="text-gold-400" />
                      <div>
                        <p className="text-sm text-white font-medium">Standard Delivery</p>
                        <p className="text-xs text-neutral-500">2-4 business days</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gold-400">${shippingCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gold-400 rounded-full" />
                  <h2 className="font-serif text-xl font-light text-white">Payment</h2>
                </div>
                <div className="bg-neutral-800/30 border border-white/5 rounded-xl p-4 hover:border-gold-400/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-gold-400" />
                    <div>
                      <p className="text-sm text-white font-medium">Cash on Delivery</p>
                      <p className="text-xs text-neutral-500">Pay when you receive your order</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || (!savedAddress && !isFormValid)}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Completing Order...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Complete Order
                  </>
                )}
              </button>
              {!savedAddress && !isFormValid && (
                <p className="text-xs text-red-400 text-center mt-2">Please fill in all required address fields correctly</p>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 sticky top-28">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-gold-400 rounded-full" />
                <h2 className="font-serif text-xl font-light text-white">Order Summary</h2>
              </div>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="w-14 h-16 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                      <img src={item.product.image_urls?.[0] || ''} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white line-clamp-1">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-500">×{item.quantity}</span>
                        {item.size && (
                          <span className="text-xs text-gold-400 font-medium bg-gold-400/10 px-2 py-0.5 rounded border border-gold-400/20">
                            {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gold-400 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <hr className="border-white/5 mb-4" />
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                {isDiscountEligible && (
                  <div className="flex justify-between text-gold-400">
                    <span>First order discount (10%)</span>
                    <span>−${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">Shipping</span>
                  <span className="text-emerald-400">${shippingCost.toFixed(2)}</span>
                </div>
                <hr className="border-white/5" />
                <div className="flex justify-between font-medium text-base pt-2">
                  <span className="text-white">Total</span>
                  <span className="text-gold-400 text-xl font-bold">${total.toFixed(2)}</span>
                </div>
              </div>

              {isDiscountEligible && (
                <p className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                  🎁 10% off applied for your first order
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} className="text-gold-400" />
                    Secure
                  </div>
                  <span className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <ArrowRight size={12} className="text-gold-400" />
                    Fast Delivery
                  </div>
                  <span className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-gold-400" />
                    Guaranteed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
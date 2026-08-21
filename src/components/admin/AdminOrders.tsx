import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {  
  Search, 
  Trash2, 
  X, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  ShoppingBag,
  Eye,
  MapPin,
  Mail,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_ICONS: Record<OrderStatus, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string | null;
  products?: {
    name: string;
    image_urls: string[];
    price: number;
    stock_quantity: number;
    id: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  shipping_address?: any;
  order_items?: OrderItem[];
  user?: {
    full_name: string;
    email: string;
  } | null;
  product_name?: string | null;
  product_price?: number | null;
  total_quantity?: number;
  first_item?: OrderItem;
  subtotal?: number;
  delivery_charge?: number;
  order_number?: string | number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoadError(null);

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image_urls, price, stock_quantity))')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error loading orders:', ordersError);
      setLoadError(ordersError.message);
      setLoading(false);
      return;
    }

    if (!ordersData) { setLoading(false); return; }

    const userIds = ordersData.map((o: any) => o.user_id).filter(Boolean);
    const { data: usersData, error: usersError } = userIds.length > 0
      ? await supabase.from('users').select('id, full_name, email').in('id', userIds)
      : { data: [], error: null };

    if (usersError) {
      console.error('Error loading users for orders:', usersError);
    }

    const usersMap = Object.fromEntries((usersData ?? []).map((u: any) => [u.id, u]));

    const sortedOrders = [...ordersData].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const merged = sortedOrders.map((o: any) => {
      const totalQuantity = o.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
      const subtotal = o.order_items?.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0) || 0;
      const deliveryCharge = Math.max(0, (o.total_amount || 0) - subtotal);
      const firstItem = o.order_items?.[0];
      
      return {
        ...o,
        user: usersMap[o.user_id] ?? null,
        product_name: firstItem?.products?.name || null,
        product_price: firstItem?.products?.price || null,
        total_quantity: totalQuantity,
        first_item: firstItem,
        subtotal: subtotal,
        delivery_charge: deliveryCharge,
        order_number: o.order_number,
        shipping_address: o.shipping_address,
      };
    });

    setOrders(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    await supabase.from('orders').update({ status }).eq('id', id);
    await load();
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(id, stock_quantity))')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      if (orderData.status !== 'cancelled' && orderData.status !== 'delivered') {
        alert('Only cancelled or delivered orders can be deleted.');
        setDeleteId(null);
        return;
      }

      if (orderData.status === 'cancelled') {
        for (const item of orderData.order_items || []) {
          if (item.product_id) {
            const newStock = (item.products?.stock_quantity || 0) + item.quantity;
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id);
          }
        }
      }

      await supabase.from('order_items').delete().eq('order_id', id);
      await supabase.from('orders').delete().eq('id', id);

      setDeleteId(null);
      await load();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const canDeleteOrder = (status: OrderStatus) => {
    return status === 'cancelled' || status === 'delivered';
  };

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(order => order.status === status).length;
  };

  const getStatusRevenue = (status: OrderStatus) => {
    return orders
      .filter(order => order.status === status)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
  };

  const filteredOrders = orders
    .filter(order => {
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase().trim();
      if (order.order_number?.toString().toLowerCase().includes(searchLower)) return true;
      if (order.product_name?.toLowerCase().includes(searchLower)) return true;
      const customerName = order.user?.full_name?.toLowerCase() || '';
      const customerEmail = order.user?.email?.toLowerCase() || '';
      if (customerName.includes(searchLower) || customerEmail.includes(searchLower)) return true;
      if (order.status?.toLowerCase().includes(searchLower)) return true;
      if (order.subtotal?.toString().includes(searchLower)) return true;
      if (order.delivery_charge?.toString().includes(searchLower)) return true;
      if (order.order_items?.some(item => item.size?.toLowerCase().includes(searchLower))) return true;
      return false;
    });

  const getStatusBadgeColor = (status: OrderStatus) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Order History</h2>
          <p className="text-sm text-neutral-500 mt-1">Track and manage all customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-neutral-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <ShoppingBag size={16} className="text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">{orders.length}</span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          Failed to load orders: {loadError}
        </div>
      )}

      {/* Status Statistics Cards with Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map(status => {
          const count = getStatusCount(status);
          const revenue = getStatusRevenue(status);
          const Icon = STATUS_ICONS[status];
          const colorMap = {
            pending: 'border-yellow-200 bg-yellow-50',
            processing: 'border-blue-200 bg-blue-50',
            shipped: 'border-indigo-200 bg-indigo-50',
            delivered: 'border-green-200 bg-green-50',
            cancelled: 'border-red-200 bg-red-50',
          };
          const textColorMap = {
            pending: 'text-yellow-700',
            processing: 'text-blue-700',
            shipped: 'text-indigo-700',
            delivered: 'text-green-700',
            cancelled: 'text-red-700',
          };
          
          return (
            <motion.div 
              key={status}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className={`border rounded-lg p-3 ${colorMap[status]} shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${textColorMap[status]} bg-white/60`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <span className={`text-lg font-bold ${textColorMap[status]}`}>
                  {loading ? '—' : count}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                <DollarSign size={12} className="text-neutral-400" />
                <span className="font-medium text-neutral-700">
                  {loading ? '—' : `$${revenue.toFixed(2)}`}
                </span>
                <span className="text-neutral-400">revenue</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, product, customer, size..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-200 outline-none text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Size</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    {Array(8).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : filteredOrders.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500">
                        {search ? 'No orders match your search' : 'No orders found'}
                      </p>
                    </td>
                  </tr>
                )
                : filteredOrders.map((order, index) => {
                  const canDelete = canDeleteOrder(order.status);
                  const badgeColor = getStatusBadgeColor(order.status);
                  const size = order.first_item?.size || null;
                  
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors duration-200 group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-semibold text-neutral-700">
                          #{order.order_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                            {order.first_item?.products?.image_urls?.[0] ? (
                              <img 
                                src={order.first_item.products.image_urls[0]} 
                                alt={order.product_name || ''}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={16} className="text-neutral-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-neutral-700 truncate max-w-[120px]">
                            {order.product_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gold-50 text-gold-700 text-xs font-medium border border-gold-200">
                          {size || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-neutral-600">
                          {formatDate(order.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-neutral-600">
                          {order.total_quantity || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={e => { 
                            updateStatus(order.id, e.target.value as OrderStatus); 
                          }}
                          disabled={updatingId === order.id}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${badgeColor}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-neutral-900">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View order details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (canDelete) {
                                setDeleteId(order.id);
                              } else {
                                alert('Only cancelled or delivered orders can be deleted.');
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                              canDelete 
                                ? 'text-red-400 hover:text-red-600 hover:bg-red-50' 
                                : 'text-red-200 cursor-not-allowed'
                            }`}
                            title={canDelete ? 'Delete order' : 'Only cancelled or delivered orders can be deleted'}
                            disabled={!canDelete}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {modalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Order #{selectedOrder.order_number}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {formatDate(selectedOrder.created_at)} at {formatTime(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Order Status & Customer */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    getStatusBadgeColor(selectedOrder.status)
                  }`}>
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-400">
                    {selectedOrder.user?.full_name || 'Guest'}
                  </span>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MapPin size={14} /> Shipping Address
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {selectedOrder.shipping_address.full_name || 'N/A'}
                      </p>
                      {selectedOrder.shipping_address.phone && (
                        <p className="text-sm text-neutral-600 flex items-center gap-2">
                          {selectedOrder.shipping_address.phone}
                        </p>
                      )}
                      {selectedOrder.shipping_address.email && (
                        <p className="text-sm text-neutral-600 flex items-center gap-2">
                          <Mail size={14} className="text-neutral-400" />
                          {selectedOrder.shipping_address.email}
                        </p>
                      )}
                      <p className="text-sm text-neutral-600">{selectedOrder.shipping_address.address_line1}</p>
                      {selectedOrder.shipping_address.address_line2 && (
                        <p className="text-sm text-neutral-600">{selectedOrder.shipping_address.address_line2}</p>
                      )}
                      <p className="text-sm text-neutral-600">
                        {selectedOrder.shipping_address.city}
                        {selectedOrder.shipping_address.postal_code && `, ${selectedOrder.shipping_address.postal_code}`}
                      </p>
                      <p className="text-sm text-neutral-600">{selectedOrder.shipping_address.country}</p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order Items</h4>
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl">
                      <div className="w-16 h-16 bg-neutral-200 rounded-lg overflow-hidden shrink-0">
                        <img 
                          src={item.products?.image_urls?.[0] || ''} 
                          alt={item.products?.name || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">{item.products?.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                          <span>Qty: {item.quantity}</span>
                          {item.size && <span>Size: {item.size}</span>}
                          <span>${item.price.toFixed(2)} each</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="text-neutral-700">
                      ${selectedOrder.subtotal?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-neutral-500">Delivery</span>
                    <span className="text-neutral-700">
                      ${selectedOrder.delivery_charge?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-neutral-200">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-gold-600">
                      ${selectedOrder.total_amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gold-400 text-neutral-900 rounded-xl font-medium hover:bg-gold-300 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 max-w-md w-full rounded-2xl shadow-2xl text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDeleteId(null)}
                className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors duration-200"
              >
                <X size={20} className="text-neutral-400" />
              </button>

              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-500" />
              </div>

              <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Order?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete this order?
                {orders.find(o => o.id === deleteId)?.status === 'cancelled' && 
                  ' The stock will be restored.'}
                {orders.find(o => o.id === deleteId)?.status === 'delivered' && 
                  ' Stock will NOT be restored as the order was already delivered.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 px-4 border border-neutral-200 bg-white text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
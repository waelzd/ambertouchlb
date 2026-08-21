import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, XCircle, Eye, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

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

const STATUS_DOT_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function AdminOverview() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, products: 0 });
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);

        // Run all queries in parallel for faster loading
        const [
          deliveredOrdersPromise,
          deliveredCountPromise,
          customersCountPromise,
          productsCountPromise,
          revenuePromise,
        ] = await Promise.all([
          // 1. Get delivered orders
          supabase
            .from('orders')
            .select(`
              id,
              order_number,
              total_amount,
              status,
              created_at,
              user_id,
              shipping_address
            `)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })
            .limit(10),

          // 2. Get total delivered count
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'delivered'),

          // 3. Get customers count
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'customer'),

          // 4. Get products count
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true }),

          // 5. Get total revenue
          supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'delivered'),
        ]);

        // Check for errors
        if (deliveredOrdersPromise.error) {
          console.error('Error fetching delivered orders:', deliveredOrdersPromise.error);
          setError('Failed to load delivered orders');
          setLoading(false);
          return;
        }

        // Get the data from all promises
        const deliveredData = deliveredOrdersPromise.data || [];
        const deliveredCount = deliveredCountPromise.count || 0;
        const customersCount = customersCountPromise.count || 0;
        const productsCount = productsCountPromise.count || 0;
        const revenueData = revenuePromise.data || [];

        // Calculate total revenue
        const totalRevenue = revenueData.reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0);

        // Fetch user details separately for delivered orders
        let usersMap: Record<string, any> = {};
        if (deliveredData.length > 0) {
          const userIds = deliveredData.map((o: any) => o.user_id).filter(Boolean);
          
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, full_name, email')
              .in('id', userIds);

            usersMap = Object.fromEntries((usersData ?? []).map((u: any) => [u.id, u]));
          }
        }

        // Now fetch order items for each delivered order
        const orderIds = deliveredData.map((o: any) => o.id).filter(Boolean);
        let orderItemsMap: Record<string, any[]> = {};
        
        if (orderIds.length > 0) {
          const { data: orderItemsData } = await supabase
            .from('order_items')
            .select(`
              id,
              quantity,
              price,
              size,
              product_id,
              order_id,
              products (
                id,
                name,
                price,
                image_urls,
                sizes
              )
            `)
            .in('order_id', orderIds);

          // Group order items by order_id
          orderItemsMap = (orderItemsData || []).reduce((acc: Record<string, any[]>, item: any) => {
            const orderId = item.order_id;
            if (!acc[orderId]) {
              acc[orderId] = [];
            }
            acc[orderId].push(item);
            return acc;
          }, {});
        }

        // Process delivered orders data with items and users
        const deliveredWithDetails = deliveredData.map((order: any) => {
          const orderItems = orderItemsMap[order.id] || [];
          
          // Calculate subtotal from order items
          const subtotal = orderItems.reduce((sum: number, item: any) => {
            return sum + (item.price * item.quantity);
          }, 0);
          
          const deliveryCharge = Math.max(0, (order.total_amount || 0) - subtotal);
          
          // Get first item for product info
          const firstItem = orderItems[0];
          const product = firstItem?.products || {};
          const productName = product?.name || null;
          const productImage = product?.image_urls?.[0] || null;
          const productSize = firstItem?.size || null;
          
          return {
            ...order,
            userName: usersMap[order.user_id]?.full_name ?? usersMap[order.user_id]?.email ?? '—',
            userEmail: usersMap[order.user_id]?.email ?? '—',
            product_name: productName,
            product_image: productImage,
            product_size: productSize,
            subtotal: subtotal,
            delivery_charge: deliveryCharge,
            total_quantity: orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
            items: orderItems,
          };
        });

        setStats({
          orders: deliveredCount,
          revenue: totalRevenue,
          customers: customersCount,
          products: productsCount,
        });
        
        setDeliveredOrders(deliveredWithDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    load();
  }, []);

  // Formatting functions
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

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  const getStatusDotColor = (status: OrderStatus) => {
    return STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS.pending;
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const statCards = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(stats.revenue), 
      icon: DollarSign,
      bg: 'bg-gold-50',
      border: 'border-gold-200',
      text: 'text-gold-700',
      iconBg: 'bg-gold-100'
    },
    { 
      label: 'Delivered Orders', 
      value: stats.orders.toString(), 
      icon: ShoppingBag,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      iconBg: 'bg-green-100'
    },
    { 
      label: 'Total Customers', 
      value: stats.customers.toString(), 
      icon: Users,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100'
    },
    { 
      label: 'Total Products', 
      value: stats.products.toString(), 
      icon: Package,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100'
    },
  ];

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle size={40} className="text-red-400" />
        </div>
        <h3 className="text-xl font-medium text-neutral-900 mb-2">Error Loading Data</h3>
        <p className="text-neutral-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-8 py-3 bg-gold-400 text-neutral-900 rounded-xl font-medium hover:bg-gold-300 transition-all duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h2>
          <p className="text-sm text-neutral-500 mt-1">Overview of your store performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, border, text, iconBg }) => (
          <motion.div 
            key={label}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className={`border ${border} ${bg} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${iconBg} border ${border}`}>
                <Icon size={18} className={text} />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {loading ? <span className="animate-pulse">—</span> : value}
            </p>
            <p className="text-xs text-neutral-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Delivered Orders Table - Matching Orders Table Design */}
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
              {loading && Array(5).fill(null).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  {Array(8).fill(null).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && deliveredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No delivered orders found</p>
                    <p className="text-xs text-neutral-400 mt-1">Orders will appear here once they are delivered</p>
                  </td>
                </tr>
              )}
              {!loading && deliveredOrders.map((order, index) => {
                const badgeColor = getStatusBadgeColor(order.status as OrderStatus);
                const dotColor = getStatusDotColor(order.status as OrderStatus);
                const label = STATUS_LABELS[order.status as OrderStatus] || 'Pending';
                const size = order.product_size || null;
                
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
                          {order.product_image ? (
                            <img 
                              src={order.product_image} 
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
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${badgeColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="View order details"
                        >
                          <Eye size={16} />
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
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Order Status & Customer */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    getStatusBadgeColor(selectedOrder.status)
                  }`}>
                    {STATUS_LABELS[selectedOrder.status as OrderStatus]}
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-400">
                    {selectedOrder.userName || 'Guest'}
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
                          <Phone size={14} className="text-neutral-400" />
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
                  {selectedOrder.items?.map((item: any) => (
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
                          <span>{formatCurrency(item.price)} each</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(item.price * item.quantity)}
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
                      {formatCurrency(selectedOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-neutral-500">Delivery</span>
                    <span className="text-neutral-700">
                      {formatCurrency(selectedOrder.delivery_charge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-neutral-200">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-gold-600">
                      {formatCurrency(selectedOrder.total_amount)}
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
    </div>
  );
}
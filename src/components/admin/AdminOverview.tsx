import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

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
          // 1. Get delivered orders with items from order_items
          supabase
            .from('order_items')
            .select(`
              id,
              quantity,
              price,
              size,
              product_id,
              order_id,
              products!inner (
                id,
                name,
                price,
                image_urls,
                sizes
              ),
              orders!inner (
                id,
                order_number,
                total_amount,
                status,
                created_at,
                user_id
              )
            `)
            .eq('orders.status', 'delivered')
            .order('orders.created_at', { ascending: false })
            .limit(10),

          // 2. Get total delivered count from orders
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

          // 5. Get total revenue from orders
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
        const orderItemsData = deliveredOrdersPromise.data || [];
        const deliveredCount = deliveredCountPromise.count || 0;
        const customersCount = customersCountPromise.count || 0;
        const productsCount = productsCountPromise.count || 0;
        const revenueData = revenuePromise.data || [];

        // Calculate total revenue
        const totalRevenue = revenueData.reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0);

        // Group order items by order_id
        const ordersMap = new Map();
        orderItemsData.forEach((item: any) => {
          const orderId = item.order_id;
          if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
              ...item.orders,
              items: [],
            });
          }
          ordersMap.get(orderId).items.push(item);
        });

        // Get unique order objects
        const uniqueOrders = Array.from(ordersMap.values());

        // Fetch user details for delivered orders
        let usersMap: Record<string, any> = {};
        if (uniqueOrders.length > 0) {
          const userIds = uniqueOrders.map((o: any) => o.user_id).filter(Boolean);
          
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, full_name, email')
              .in('id', userIds);

            usersMap = Object.fromEntries((usersData ?? []).map((u: any) => [u.id, u]));
          }
        }

        // Process delivered orders data
        const deliveredWithUsers = uniqueOrders.map((order: any) => {
          const orderItems = order.items || [];
          
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
            order_number: order.order_number,
            created_at: order.created_at,
            status: order.status,
            total_amount: order.total_amount,
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
        
        setDeliveredOrders(deliveredWithUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    load();
  }, []);

  // Rest of the component remains the same...
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h2>
          <p className="text-sm text-neutral-500 mt-1">Overview of your store performance</p>
        </div>
      </div>

      {/* Stats Cards - Clean & Simple */}
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

      {/* Delivered Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Delivered Orders</h2>
              <p className="text-xs text-neutral-500">Recent delivered orders</p>
            </div>
          </div>
          <span className="text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-full border border-neutral-200">
            {deliveredOrders.length} {deliveredOrders.length === 1 ? 'order' : 'orders'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Size</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Subtotal</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Delivery</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array(5).fill(null).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  {Array(9).fill(null).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && deliveredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">No delivered orders found</p>
                    <p className="text-xs text-neutral-400 mt-1">Orders will appear here once they are delivered</p>
                  </td>
                </tr>
              )}
              {!loading && deliveredOrders.map((order, index) => {
                const badgeColor = getStatusBadgeColor(order.status as OrderStatus);
                const dotColor = getStatusDotColor(order.status as OrderStatus);
                const label = STATUS_LABELS[order.status as OrderStatus] || 'Pending';
                
                return (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-semibold text-neutral-700">
                        #{order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {order.product_image && (
                          <div className="w-10 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                            <img 
                              src={order.product_image} 
                              alt={order.product_name || ''} 
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <span className="text-sm text-neutral-800 truncate max-w-[150px] block">
                          {order.product_name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gold-50 text-gold-700 text-xs font-medium border border-gold-200">
                        {order.product_size || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{order.userName}</p>
                        <p className="text-xs text-neutral-400">{order.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-neutral-500">{formatDate(order.created_at)}</div>
                      <div className="text-xs text-neutral-400">{formatTime(order.created_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${badgeColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-700">
                      {formatCurrency(order.subtotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gold-600">
                      {formatCurrency(order.delivery_charge)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-neutral-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
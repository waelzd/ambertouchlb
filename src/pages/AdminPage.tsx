import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Image, 
  Tag, 
  LogOut, 
  ChevronRight, 
  Menu,
  ChevronDown,
  User,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Mail,
  Eye,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AdminOverview from '../components/admin/AdminOverview';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCustomers from '../components/admin/AdminCustomers';
import AdminBanners from '../components/admin/AdminBanners';
import AdminCategories from '../components/admin/AdminCategories';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/banners', label: 'Banners', icon: Image },
];

const ORDER_STATUS_ICONS = {
  pending: Clock,
  processing: Clock,
  delivered: CheckCircle,
  shipped: CheckCircle,
  cancelled: XCircle,
};

const ORDER_STATUS_COLORS = {
  pending: 'text-yellow-600 bg-yellow-50',
  processing: 'text-blue-600 bg-blue-50',
  shipped: 'text-indigo-600 bg-indigo-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

export default function AdminPage() {
  const { profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      navigate('/');
    }
  }, [profile, loading, navigate]);

  // Load pending orders for notifications (only 'pending' status)
  useEffect(() => {
    if (profile?.role === 'admin') {
      loadPendingOrders();
      
      // Subscribe to new orders and updates
      const subscription = supabase
        .channel('orders_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          () => {
            loadPendingOrders();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders'
          },
          () => {
            loadPendingOrders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  const loadPendingOrders = async () => {
    // Fetch only pending orders (not processing)
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        user_id,
        users (
          full_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    
    setPendingOrders(data ?? []);
    // Count only pending orders as unread
    const unread = data?.filter(o => o.status === 'pending').length || 0;
    setUnreadCount(unread);
  };

  // Fetch order details with items
  const fetchOrderDetails = async (orderId: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          user_id,
          users (
            full_name,
            email
          ),
          order_items (
            id,
            quantity,
            price,
            size,
            product_id,
            products (
              id,
              name,
              price,
              image_urls,
              sizes
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
        return;
      }

      setOrderDetails(data);
      setModalOpen(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrderClick = (order: any) => {
    fetchOrderDetails(order.id);
  };

  const closeModal = () => {
    setModalOpen(false);
    setOrderDetails(null);
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Close profile dropdown
      if (profileOpen && !target.closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
      
      // Close notifications dropdown
      if (notificationsOpen && !target.closest('.notifications-dropdown')) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen, notificationsOpen]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Loading admin panel...</p>
      </div>
    </div>
  );
  
  if (!profile || profile.role !== 'admin') return null;

  const currentPage = NAV_ITEMS.find(n => 
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label ?? 'Admin';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 text-white flex flex-col transition-transform duration-300 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Brand */}
        <div className="p-6 border-b border-neutral-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
              <span className="text-neutral-900 font-bold text-sm">AT</span>
            </div>
            <div>
              <p className="font-serif text-lg tracking-widest uppercase text-gold-400 leading-none">Amber Touch</p>
              <p className="text-[10px] text-gold-200/70 tracking-wider mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider px-4 py-2 font-medium">
            Main Menu
          </p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 group ${
                  active 
                    ? 'bg-gold-400/10 text-gold-400' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={active ? 'text-gold-400' : 'text-neutral-500 group-hover:text-white'} />
                <span className="font-medium">{label}</span>
                {active && (
                  <div className="ml-auto w-1 h-6 bg-gold-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center shrink-0">
              <User size={18} className="text-neutral-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-neutral-400 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut size={16} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/50 px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{currentPage}</span>
            <span className="text-xs text-neutral-600">/</span>
            <span className="text-xs text-neutral-500">Admin</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
              <Search size={16} className="absolute left-3 text-neutral-500" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20 transition-all duration-200 w-48"
              />
            </div>

            {/* Notifications - Professional Design */}
            <div className="relative notifications-dropdown">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all duration-200 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gold-400 text-neutral-900 text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-gold-400/30">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-96 max-h-[450px] bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden animate-fadeIn">
                  <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-800/30">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-gold-400" />
                      <h3 className="text-sm font-semibold text-white">
                        Pending Orders
                        {pendingOrders.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-neutral-400">
                            ({pendingOrders.length})
                          </span>
                        )}
                      </h3>
                    </div>
                    <Link 
                      to="/admin/orders" 
                      className="text-xs text-gold-400 hover:text-gold-300 font-medium transition-colors flex items-center gap-1"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View All
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[360px]">
                    {pendingOrders.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle size={28} className="text-green-400" />
                        </div>
                        <p className="text-sm text-neutral-400">No pending orders</p>
                        <p className="text-xs text-neutral-500 mt-1">All orders are processed</p>
                      </div>
                    ) : (
                      pendingOrders.map((order) => {
                        const StatusIcon = ORDER_STATUS_ICONS[order.status as keyof typeof ORDER_STATUS_ICONS] || Clock;
                        const statusColor = ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || 'text-neutral-600 bg-neutral-50';
                        const orderNumber = order.order_number || `#ORD-${order.id.slice(0, 8)}`;
                        
                        return (
                          <div
                            key={order.id}
                            onClick={() => handleOrderClick(order)}
                            className="flex items-start gap-4 px-5 py-4 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50 last:border-0 cursor-pointer group"
                          >
                            <div className={`p-2.5 rounded-xl ${statusColor} shrink-0`}>
                              <StatusIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-white group-hover:text-gold-400 transition-colors">
                                  {orderNumber}
                                </p>
                                <Eye size={14} className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs text-neutral-400 truncate mt-0.5">
                                {order.users?.full_name || 'Unknown'} • {formatCurrency(order.total_amount || 0)}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${statusColor}`}>
                                  {order.status}
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View Store */}
            <Link 
              to="/" 
              className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-all duration-200 border border-neutral-700/30 hover:border-neutral-600"
            >
              View Store <ChevronRight size={12} />
            </Link>

            {/* Profile dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-neutral-800 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                  <User size={14} className="text-neutral-900" />
                </div>
                <ChevronDown size={14} className="text-neutral-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 py-2 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-neutral-800">
                    <p className="text-sm font-medium text-white">{profile.full_name}</p>
                    <p className="text-xs text-neutral-400">{profile.email}</p>
                  </div>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <ShoppingCart size={14} />
                    View Store
                  </Link>
                  <button
                    onClick={() => { 
                      setProfileOpen(false);
                      signOut(); 
                      navigate('/'); 
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border-t border-neutral-800 mt-1"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/products/*" element={<AdminProducts />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/customers" element={<AdminCustomers />} />
            <Route path="/banners" element={<AdminBanners />} />
            <Route path="/categories" element={<AdminCategories />} />
          </Routes>
        </main>
      </div>

      {/* Order Details Modal - Professional Design */}
      <AnimatePresence>
        {modalOpen && orderDetails && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
            onClick={handleBackdropClick}
          >
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
            />
            
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Order <span className="text-gold-400">{orderDetails.order_number || `#${orderDetails.id.slice(0, 8)}`}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {formatFullDate(orderDetails.created_at)}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-3 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-neutral-400 mt-4">Loading order details...</p>
                </div>
              ) : (
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  {/* Order Status */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                      ORDER_STATUS_COLORS[orderDetails.status as keyof typeof ORDER_STATUS_COLORS] || 'text-neutral-600 bg-neutral-50'
                    }`}>
                      {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                    </span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-xs text-neutral-500">
                      {formatDate(orderDetails.created_at)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-4 mb-6">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-neutral-500" />
                        <span className="text-sm text-white">{orderDetails.users?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-neutral-500" />
                        <span className="text-sm text-neutral-300">{orderDetails.users?.email || 'No email'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {orderDetails.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-neutral-800/30 border border-neutral-700/30 rounded-xl">
                          {item.products?.image_urls?.[0] && (
                            <div className="w-16 h-20 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                              <img 
                                src={item.products.image_urls[0]} 
                                alt={item.products.name || 'Product'} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{item.products?.name || 'Unknown Product'}</p>
                            <div className="flex items-center gap-3 mt-1">
                              {item.size && (
                                <span className="text-xs text-neutral-400">Size: {item.size}</span>
                              )}
                              <span className="text-xs text-neutral-400">Qty: {item.quantity}</span>
                              <span className="text-xs font-medium text-gold-400">{formatCurrency(item.price)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-neutral-800 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Subtotal</span>
                      <span className="text-white">
                        {formatCurrency(orderDetails.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-neutral-400">Delivery</span>
                      <span className="text-white">
                        {formatCurrency(Math.max(0, (orderDetails.total_amount || 0) - (orderDetails.order_items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0)))}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold mt-3 pt-3 border-t border-neutral-800">
                      <span className="text-white">Total</span>
                      <span className="text-gold-400">{formatCurrency(orderDetails.total_amount || 0)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <Link
                      to={`/admin/orders`}
                      onClick={closeModal}
                      className="flex-1 text-center px-4 py-2.5 bg-gold-400 text-neutral-900 rounded-xl font-medium hover:bg-gold-300 transition-all duration-300"
                    >
                      Go to Orders
                    </Link>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2.5 border border-neutral-700 text-neutral-400 rounded-xl font-medium hover:bg-neutral-800 hover:text-white transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
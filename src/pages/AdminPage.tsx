import { useEffect, useState } from 'react';
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
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AdminOverview from '../components/admin/AdminOverview';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCustomers from '../components/admin/AdminCustomers';
import AdminBanners from '../components/admin/AdminBanners';
import AdminCategories from '../components/admin/AdminCategories';

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

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      navigate('/');
    }
  }, [profile, loading, navigate]);

  // Load pending orders for notifications
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
    // Fetch only pending and processing orders
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
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    setPendingOrders(data ?? []);
    // Count only pending and processing orders as unread
    const unread = data?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
    setUnreadCount(unread);
  };

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500">Loading admin panel...</p>
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

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
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
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200/50 px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900">{currentPage}</span>
            <span className="text-xs text-neutral-400">/</span>
            <span className="text-xs text-neutral-400">Admin</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications - Only Pending Orders */}
            <div className="relative notifications-dropdown">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[400px] bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Pending Orders
                      {pendingOrders.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-neutral-500">
                          ({pendingOrders.length})
                        </span>
                      )}
                    </h3>
                    <Link 
                      to="/admin/orders" 
                      className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View All
                    </Link>
                  </div>
                  <div className="overflow-y-auto max-h-[340px]">
                    {pendingOrders.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <CheckCircle size={32} className="text-green-300 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">No pending orders</p>
                        <p className="text-xs text-neutral-400">All orders are processed</p>
                      </div>
                    ) : (
                      pendingOrders.map((order) => {
                        const StatusIcon = ORDER_STATUS_ICONS[order.status as keyof typeof ORDER_STATUS_ICONS] || Clock;
                        const statusColor = ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || 'text-neutral-600 bg-neutral-50';
                        const orderNumber = order.order_number || `#ORD-${order.id.slice(0, 8)}`;
                        
                        return (
                          <Link
                            key={order.id}
                            to={`/admin/orders`}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <div className={`p-2 rounded-lg ${statusColor}`}>
                              <StatusIcon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900">
                                {orderNumber}
                              </p>
                              <p className="text-xs text-neutral-500 truncate">
                                {order.users?.full_name || 'Unknown'} • {formatCurrency(order.total_amount || 0)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                                  {order.status}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </div>
                          </Link>
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
              className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              View Store <ChevronRight size={12} />
            </Link>

            {/* Profile dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                  <User size={14} className="text-neutral-900" />
                </div>
                <ChevronDown size={14} className="text-neutral-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900">{profile.full_name}</p>
                    <p className="text-xs text-neutral-500">{profile.email}</p>
                  </div>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
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
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-neutral-100 mt-1"
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
    </div>
  );
}
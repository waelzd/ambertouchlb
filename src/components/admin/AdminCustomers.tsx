import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Users, Search, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const load = () => {
    supabase
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCustomers(data ?? []);
        setFilteredCustomers(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = customers.filter(customer => 
        customer.full_name?.toLowerCase().includes(query) ||
        customer.phone?.includes(query) ||
        customer.email?.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Format date to dd/mm/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Customer Management</h2>
          <p className="text-sm text-neutral-500 mt-1">View your store customers and their information</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <Users size={16} className="text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">{filteredCustomers.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-200 outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-neutral-400 mt-2">
            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                  Phone
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    {Array(4).fill(null).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : filteredCustomers.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500">
                        {searchQuery ? 'No customers match your search' : 'No customers found'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-sm text-gold-600 hover:text-gold-700 font-medium mt-2"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )
                : filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-gold-200 rounded-full flex items-center justify-center shrink-0">
                          <User size={18} className="text-gold-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {customer.full_name ?? 'Unknown User'}
                          </p>
                          <p className="text-xs text-neutral-400 sm:hidden">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-neutral-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 hidden md:table-cell">
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-neutral-400" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">No phone</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-neutral-400" />
                        <span>{formatDate(customer.created_at)}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
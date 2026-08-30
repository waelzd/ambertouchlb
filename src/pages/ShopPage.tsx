import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Search, Grid3X3, Sparkles, Tag, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import ProductCard from '../components/products/ProductCard';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const PAGE_SIZE = 12;

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [error, setError] = useState<string | null>(null);

  const categoryParam = searchParams.get('category') ?? '';
  const filterParam = searchParams.get('filter') ?? '';
  const searchParam = searchParams.get('search') ?? '';
  const sortParam = searchParams.get('sort') ?? 'newest';

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*');
        
        if (error) {
          console.error('Categories error:', error);
          setError('Failed to load categories');
          return;
        }
        
        console.log('Categories loaded:', data);
        setCategories((data as Category[]) ?? []);
      } catch (err) {
        console.error('Unexpected error loading categories:', err);
        setError('Unexpected error loading categories');
      }
    };
    
    loadCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching products with params:', {
        categoryParam,
        filterParam,
        searchParam,
        sortParam,
        page,
        priceMin,
        priceMax,
      });

      // Start building the query
      let query = supabase
        .from('products')
        .select(`
          *,
          categories!product_categories (
            id,
            name,
            slug,
            description,
            image_url,
            created_at,
            updated_at
          )
        `, { count: 'exact' })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      // Handle category filter - using the junction table
      if (categoryParam) {
        const cat = categories.find(c => c.slug === categoryParam);
        if (cat) {
          console.log('Filtering by category:', cat.id, cat.name);
          // First get product IDs from the junction table
          const { data: productCategoryData, error: pcError } = await supabase
            .from('product_categories')
            .select('product_id')
            .eq('category_id', cat.id);

          if (pcError) {
            console.error('Error fetching product_categories:', pcError);
            setProducts([]);
            setTotal(0);
            setLoading(false);
            return;
          }

          const productIds = productCategoryData?.map(pc => pc.product_id) || [];
          console.log('Product IDs for category:', productIds);

          if (productIds.length === 0) {
            setProducts([]);
            setTotal(0);
            setLoading(false);
            return;
          }

          query = query.in('id', productIds);
        } else {
          console.warn('Category not found for slug:', categoryParam);
          setProducts([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }

      // Handle sale filter
      if (filterParam === 'sale') {
        console.log('Filtering by sale items');
        query = query.not('sale_price', 'is', null);
      }

      // Handle search
      if (searchParam) {
        console.log('Searching for:', searchParam);
        query = query.ilike('name', `%${searchParam}%`);
      }

      // Handle price range
      if (priceMin) {
        const min = parseFloat(priceMin);
        if (!isNaN(min)) {
          console.log('Price min:', min);
          query = query.gte('price', min);
        }
      }
      if (priceMax) {
        const max = parseFloat(priceMax);
        if (!isNaN(max)) {
          console.log('Price max:', max);
          query = query.lte('price', max);
        }
      }

      // Handle sorting
      if (sortParam === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sortParam === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      console.log('Executing query...');
      const { data, count, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('Products fetch error:', fetchError);
        setError(`Failed to fetch products: ${fetchError.message}`);
        setProducts([]);
        setTotal(0);
      } else {
        console.log(`Fetched ${data?.length || 0} products, total: ${count || 0}`);
        setProducts((data as Product[]) ?? []);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching products:', err);
      setError('Unexpected error occurred while fetching products');
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [categoryParam, filterParam, searchParam, sortParam, page, priceMin, priceMax, categories]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryParam, filterParam, searchParam, sortParam, priceMin, priceMax]);

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceMin('');
    setPriceMax('');
  };

  const hasFilters = categoryParam || filterParam || searchParam || priceMin || priceMax;

  const pageTitle = searchParam
    ? `Search: "${searchParam}"`
    : filterParam === 'sale' ? 'Sale'
    : categoryParam
    ? categories.find(c => c.slug === categoryParam)?.name ?? 'Shop'
    : 'All Products';

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-gold-400 text-neutral-900 rounded-lg hover:bg-gold-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Page header with gold accent */}
      <div className="relative border-b border-neutral-800/50 bg-gradient-to-b from-neutral-900 to-neutral-950 py-16 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400 mb-3">
            {searchParam ? 'Search Results' : 'Collection'}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white">
            {pageTitle}
          </h1>
          <div className="w-16 h-0.5 bg-gold-400/50 mx-auto mt-4" />
          <p className="mt-4 text-sm text-neutral-400">{total} products found</p>
        </motion.div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-800/50">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2.5 text-sm font-medium text-neutral-400 hover:text-gold-400 transition-all duration-300 group"
          >
            <SlidersHorizontal size={16} className="group-hover:text-gold-400 transition-colors" />
            <span>Filters</span>
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-gold-400 text-neutral-900 text-[10px] font-bold flex items-center justify-center">
                !
              </span>
            )}
          </button>

          <div className="flex items-center gap-4">
            {/* Grid toggle */}
            <div className="hidden md:flex items-center gap-1 bg-neutral-800/50 rounded-lg p-1 border border-neutral-700/50">
              {([2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setGridCols(n)}
                  className={`p-1.5 rounded-md transition-all duration-300 ${
                    gridCols === n 
                      ? 'bg-gold-400 text-neutral-900 shadow-lg shadow-gold-400/20' 
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'
                  }`}
                >
                  <Grid3X3 size={14} />
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortParam}
                onChange={e => updateFilter('sort', e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 text-sm bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 rounded-lg focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30 cursor-pointer transition-all duration-300 hover:border-neutral-600"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-neutral-900 text-neutral-300">
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Active filters with gold styling */}
        {hasFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap mb-6"
          >
            {categoryParam && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs rounded-full">
                {categories.find(c => c.slug === categoryParam)?.name || categoryParam}
                <button onClick={() => updateFilter('category', '')} className="hover:text-gold-300 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            {filterParam && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs rounded-full capitalize">
                <Tag size={12} />
                {filterParam}
                <button onClick={() => updateFilter('filter', '')} className="hover:text-gold-300 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            {searchParam && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs rounded-full">
                <Search size={12} />
                "{searchParam}"
                <button onClick={() => updateFilter('search', '')} className="hover:text-gold-300 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            {priceMin && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs rounded-full">
                Min: ${priceMin}
                <button onClick={() => setPriceMin('')} className="hover:text-gold-300 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            {priceMax && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs rounded-full">
                Max: ${priceMax}
                <button onClick={() => setPriceMax('')} className="hover:text-gold-300 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            <button 
              onClick={clearFilters} 
              className="text-xs text-neutral-500 hover:text-gold-400 transition-colors ml-2 underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          </motion.div>
        )}

        <div className="flex gap-8">
          {/* Sidebar filters (desktop) - Gold themed */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 space-y-8">
              {/* Category */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400 mb-4 border-b border-neutral-800/50 pb-2">
                  Category
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      onClick={() => updateFilter('category', '')}
                      className={`text-sm transition-all duration-300 ${
                        !categoryParam 
                          ? 'text-gold-400 font-medium' 
                          : 'text-neutral-400 hover:text-gold-400'
                      }`}
                    >
                      All Products
                    </button>
                  </li>
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <button
                        onClick={() => updateFilter('category', cat.slug)}
                        className={`text-sm transition-all duration-300 ${
                          categoryParam === cat.slug 
                            ? 'text-gold-400 font-medium' 
                            : 'text-neutral-400 hover:text-gold-400'
                        }`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price range */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400 mb-4 border-b border-neutral-800/50 pb-2">
                  Price Range
                </p>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={e => setPriceMin(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-sm bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 rounded-lg focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30 transition-all duration-300"
                    />
                  </div>
                  <span className="text-neutral-500 text-sm">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={e => setPriceMax(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-sm bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 rounded-lg focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30 transition-all duration-300"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setPage(1);
                  }} 
                  className="mt-3 w-full py-2 bg-gold-400 text-neutral-900 text-xs font-medium tracking-wider uppercase rounded-lg hover:shadow-lg hover:shadow-gold-400/20 transition-all duration-300 hover:scale-[1.02]"
                >
                  Apply Price
                </button>
              </div>

              {/* Quick filters */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400 mb-4 border-b border-neutral-800/50 pb-2">
                  Filters
                </p>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      onClick={() => updateFilter('filter', filterParam === 'sale' ? '' : 'sale')}
                      className={`text-sm transition-all duration-300 flex items-center gap-2 ${
                        filterParam === 'sale' 
                          ? 'text-gold-400 font-medium' 
                          : 'text-neutral-400 hover:text-gold-400'
                      }`}
                    >
                      <Sparkles size={14} className={filterParam === 'sale' ? 'text-gold-400' : 'text-neutral-500'} />
                      On Sale
                    </button>
                  </li>
                </ul>
              </div>

              {/* Active filters summary */}
              {hasFilters && (
                <div className="pt-4 border-t border-neutral-800/50">
                  <button 
                    onClick={clearFilters} 
                    className="w-full py-2.5 border border-neutral-700/50 text-neutral-400 text-xs font-medium tracking-wider uppercase rounded-lg hover:border-gold-400 hover:text-gold-400 transition-all duration-300"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-6 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                {Array(PAGE_SIZE).fill(null).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-neutral-800/50 rounded-2xl" />
                    <div className="mt-4 h-3 bg-neutral-800/50 rounded w-2/3" />
                    <div className="mt-2 h-4 bg-neutral-800/50 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-800/50 rounded-full mb-6">
                  <Search size={32} className="text-neutral-600" />
                </div>
                <p className="font-serif text-2xl text-neutral-300 mb-2">No products found</p>
                <p className="text-sm text-neutral-500 mb-6">Try adjusting your filters or search terms</p>
                <button 
                  onClick={clearFilters} 
                  className="px-8 py-3 bg-gold-400 text-neutral-900 rounded-lg font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              <div className={`grid gap-6 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}

            {/* Pagination with gold styling */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-14 pt-8 border-t border-neutral-800/50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-gold-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 text-sm rounded-lg transition-all duration-300 ${
                        p === page 
                          ? 'bg-gold-400 text-neutral-900 shadow-lg shadow-gold-400/20 font-medium' 
                          : 'text-neutral-400 hover:text-gold-400 hover:bg-neutral-800/50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-gold-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer with gold theme */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-neutral-950"
              onClick={() => setFilterOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 z-[90] w-80 bg-neutral-900 shadow-2xl shadow-neutral-950 overflow-y-auto border-r border-neutral-800/50"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Filter size={18} className="text-gold-400" />
                  <span className="font-medium tracking-widest uppercase text-sm text-white">Filters</span>
                </div>
                <button 
                  onClick={() => setFilterOpen(false)} 
                  className="text-neutral-400 hover:text-gold-400 transition-colors p-1 hover:bg-neutral-800/50 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-8">
                {/* Category */}
                <div>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400 mb-4 border-b border-neutral-800/50 pb-2">
                    Category
                  </p>
                  <ul className="space-y-3">
                    <li>
                      <button 
                        onClick={() => { updateFilter('category', ''); setFilterOpen(false); }} 
                        className={`text-sm transition-all duration-300 ${
                          !categoryParam ? 'text-gold-400 font-medium' : 'text-neutral-400'
                        }`}
                      >
                        All Products
                      </button>
                    </li>
                    {categories.map(cat => (
                      <li key={cat.id}>
                        <button 
                          onClick={() => { updateFilter('category', cat.slug); setFilterOpen(false); }} 
                          className={`text-sm transition-all duration-300 ${
                            categoryParam === cat.slug ? 'text-gold-400 font-medium' : 'text-neutral-400'
                          }`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Filter */}
                <div>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400 mb-4 border-b border-neutral-800/50 pb-2">
                    Filter
                  </p>
                  <ul className="space-y-3">
                    <li>
                      <button 
                        onClick={() => { updateFilter('filter', filterParam === 'sale' ? '' : 'sale'); setFilterOpen(false); }} 
                        className={`text-sm transition-all duration-300 flex items-center gap-2 ${
                          filterParam === 'sale' ? 'text-gold-400 font-medium' : 'text-neutral-400'
                        }`}
                      >
                        <Sparkles size={14} className={filterParam === 'sale' ? 'text-gold-400' : 'text-neutral-500'} />
                        On Sale
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Price Range */}
                <div>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400 mb-4 border-b border-neutral-800/50 pb-2">
                    Price Range
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={e => setPriceMin(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-sm bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 rounded-lg focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30"
                      />
                    </div>
                    <span className="text-neutral-500 text-sm">—</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={e => setPriceMax(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-sm bg-neutral-800/50 border border-neutral-700/50 text-neutral-300 rounded-lg focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setPage(1);
                      setFilterOpen(false); 
                    }} 
                    className="mt-3 w-full py-2 bg-gold-400 text-neutral-900 text-xs font-medium tracking-wider uppercase rounded-lg hover:shadow-lg hover:shadow-gold-400/20 transition-all duration-300"
                  >
                    Apply Price
                  </button>
                </div>

                {/* Clear All */}
                <button 
                  onClick={() => { clearFilters(); setFilterOpen(false); }} 
                  className="w-full py-3 border border-neutral-700/50 text-neutral-400 text-xs font-medium tracking-wider uppercase rounded-lg hover:border-gold-400 hover:text-gold-400 transition-all duration-300"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
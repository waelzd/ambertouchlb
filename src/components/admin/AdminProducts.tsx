import { useEffect, useRef, useState } from 'react';
import { 
  Plus, Edit2, Trash2, X, Search, Upload, 
  ShoppingBag, Image as ImageIcon, CheckCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, Category, ProductSize } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_PRODUCT = {
  name: '', 
  description: '', 
  sale_price: '',
  stock_quantity: '5',
  category_id: '',
  image_urls: [''],
};

const EMPTY_ERRORS = {
  name: false,
  category_id: false,
};

// Safely parse a price string to a 2-decimal number, avoiding
// floating point artifacts like 4 -> 3.999999999999.
function toMoney(value: string): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

type ImageEntry = { type: 'url'; value: string } | { type: 'file'; file: File; preview: string };

// Image Input Component - Simplified like Category page
function ImageInput({
  entries,
  onChange,
}: {
  entries: ImageEntry[];
  onChange: (entries: ImageEntry[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Replace the first entry with the file
      if (entries.length > 0 && entries[0].type === 'url' && !entries[0].value) {
        // If first entry is empty URL, replace it
        const preview = URL.createObjectURL(file);
        onChange([{ type: 'file', file, preview }]);
      } else {
        // Add as new entry
        const preview = URL.createObjectURL(file);
        onChange([...entries, { type: 'file', file, preview }]);
      }
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const entry = entries[index];
    if (entry.type === 'file') {
      URL.revokeObjectURL(entry.preview);
    }
    onChange(entries.filter((_, i) => i !== index));
    // If no entries left, add an empty URL entry
    if (entries.length === 1) {
      onChange([{ type: 'url', value: '' }]);
    }
  };

  // const updateUrl = (value: string) => {
  //   if (entries.length > 0 && entries[0].type === 'url') {
  //     // Update the first URL entry
  //     const next = [...entries];
  //     next[0] = { type: 'url', value };
  //     onChange(next);
  //   } else {
  //     // Add new URL entry
  //     onChange([...entries, { type: 'url', value }]);
  //   }
  // };

  return (
    <div>
      {/* Image Upload Area - Like Category page */}
      <div 
        className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-gold-400 transition-all duration-200 cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {entries.length > 0 && entries[0].type === 'file' ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 shrink-0 bg-neutral-100 rounded-xl overflow-hidden">
              <img src={entries[0].preview} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-neutral-900 truncate">{entries[0].file.name}</p>
              <p className="text-xs text-neutral-400">{(entries[0].file.size / 1024).toFixed(0)} KB</p>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }} 
                className="text-xs text-gold-600 hover:text-gold-700 font-medium mt-1 underline"
              >
                Change file
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(0);
              }}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <X size={16} className="text-neutral-400" />
            </button>
          </div>
        ) : entries.length > 0 && entries[0].type === 'url' && entries[0].value ? (
          <div className="relative">
            <img 
              src={entries[0].value} 
              alt="Preview" 
              className="max-h-40 mx-auto rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(0);
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
            >
              <X size={14} />
            </button>
            <p className="text-xs text-neutral-400 mt-2">Click to change image</p>
          </div>
        ) : (
          <div className="py-8">
            <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={24} className="text-gold-400" />
            </div>
            <p className="text-sm font-medium text-neutral-700">Click to upload an image</p>
            <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>

      {/* URL Input - Optional 
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Or enter image URL:</span>
          <input
            type="url"
            value={entries.length > 0 && entries[0].type === 'url' ? entries[0].value : ''}
            onChange={(e) => updateUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-sm"
          />
        </div>
      </div>
      */}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// Sizes Input Component
function SizesInput({
  sizes,
  onChange,
  showErrors,
}: {
  sizes: ProductSize[];
  onChange: (sizes: ProductSize[]) => void;
  showErrors: boolean;
}) {
  const addSize = () => onChange([...sizes, { label: '', price: 0 }]);

  // Strip the "ML" suffix for display, so the input only shows the number
  const displayValue = (label: string) => label.replace(/ML$/i, '');

  const updateLabel = (i: number, rawValue: string) => {
    // Only allow digits (and a decimal point, in case of e.g. 62.5ML)
    const digits = rawValue.replace(/[^0-9.]/g, '');
    const next = [...sizes];
    next[i] = { ...next[i], label: digits ? `${digits}ML` : '' };
    onChange(next);
  };

  const updatePrice = (i: number, priceStr: string) => {
    const next = [...sizes];
    next[i] = { ...next[i], price: toMoney(priceStr) };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(sizes.filter((_, j) => j !== i));
  };

  return (
    <div className="space-y-3">
      {sizes.map((size, i) => {
        const labelInvalid = showErrors && !size.label.trim();
        const priceInvalid = showErrors && (!size.price || size.price <= 0);
        return (
          <div key={i}>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  value={displayValue(size.label)}
                  onChange={e => updateLabel(i, e.target.value)}
                  onKeyDown={e => {
                    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                  }}
                  inputMode="decimal"
                  placeholder="e.g. 100"
                  className={`input-field text-sm py-2.5 pl-4 pr-12 w-full rounded-xl focus:ring-2 ${
                    labelInvalid
                      ? 'border-red-500 placeholder-red-400 focus:border-red-500 focus:ring-red-400/20'
                      : 'border-neutral-200 focus:border-gold-400 focus:ring-gold-400/20'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none">
                  ML
                </span>
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={size.price || ''}
                  onChange={e => updatePrice(i, e.target.value)}
                  onKeyDown={e => {
                    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                  }}
                  placeholder="0.00"
                  className={`input-field text-sm py-2.5 pl-7 pr-3 w-full rounded-xl focus:ring-2 ${
                    priceInvalid
                      ? 'border-red-500 placeholder-red-400 focus:border-red-500 focus:ring-red-400/20'
                      : 'border-neutral-200 focus:border-gold-400 focus:ring-gold-400/20'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-neutral-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            {(labelInvalid || priceInvalid) && (
              <div className="flex gap-3 mt-1">
                <p className={`text-xs text-red-500 flex-1 ${labelInvalid ? '' : 'invisible'}`}>
                  Size is mandatory
                </p>
                <p className={`text-xs text-red-500 w-32 shrink-0 ${priceInvalid ? '' : 'invisible'}`}>
                  Price must be greater than 0
                </p>
                <div className="w-9 shrink-0" />
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSize}
        className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1.5 transition-colors"
      >
        <Plus size={16} /> Add a size option
      </button>
    </div>
  );
}

// Upload function
async function uploadImageFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'images');
  
  if (!bucketExists) {
    await supabase.storage.createBucket('images', {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/*'],
    });
  }
  
  const { error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(path);
  return urlData.publicUrl;
}

// Function to get the next product code
async function getNextProductCode(): Promise<number> {
  const { data, error } = await supabase
    .from('products')
    .select('code')
    .order('code', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error getting next code:', error);
    return 1000; // Default starting code
  }
  
  if (data && data.length > 0 && data[0].code) {
    return data[0].code + 1;
  }
  
  return 1000; // First product code
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([{ type: 'url', value: '' }]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nextCode, setNextCode] = useState<number>(1000);
  const [fieldErrors, setFieldErrors] = useState({ ...EMPTY_ERRORS });
  const [showSizeErrors, setShowSizeErrors] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(null);

  const load = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('created_at', { ascending: true }),
      supabase.from('categories').select('*'),
    ]);
    setProducts((prods as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showSuccessMessage = (message: string) => {
    if (successTimeout) {
      clearTimeout(successTimeout);
    }
    setSuccessMessage(message);
    setShowSuccess(true);
    const timeout = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    setSuccessTimeout(timeout);
  };

  // Get next code when opening create modal
  const openCreate = async () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_PRODUCT });
    setImageEntries([{ type: 'url', value: '' }]);
    setSizes([]);
    setFieldErrors({ ...EMPTY_ERRORS });
    setShowSizeErrors(false);
    setTouched({});
    const code = await getNextProductCode();
    setNextCode(code);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, 
      description: p.description ?? '',
      sale_price: p.sale_price?.toString() || '',
      stock_quantity: p.stock_quantity?.toString() || '5',
      category_id: p.category_id ?? '',
      image_urls: p.image_urls.length > 0 ? p.image_urls : [''],
    });
    setImageEntries(
      p.image_urls.length > 0
        ? [{ type: 'url', value: p.image_urls[0] }]
        : [{ type: 'url', value: '' }]
    );
    setSizes(p.sizes ?? []);
    setFieldErrors({ ...EMPTY_ERRORS });
    setShowSizeErrors(false);
    setTouched({});
    setModalOpen(true);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, category_id: true });

    const sizesInvalid = sizes.length === 0 || sizes.some(s => !s.label.trim() || !s.price || s.price <= 0);

    const errors = {
      name: !form.name.trim(),
      category_id: !form.category_id,
    };

    if (errors.name || errors.category_id || sizesInvalid) {
      setFieldErrors(errors);
      setShowSizeErrors(sizesInvalid);
      return;
    }

    setFieldErrors({ ...EMPTY_ERRORS });
    setShowSizeErrors(false);
    setSaving(true);

    const resolvedUrls: string[] = [];
    for (const entry of imageEntries) {
      if (entry.type === 'file') {
        try {
          const url = await uploadImageFile(entry.file);
          resolvedUrls.push(url);
        } catch (err) {
          console.error('Upload failed:', err);
          setErrorMessage(`Failed to upload ${entry.file.name}`);
          setShowError(true);
          setSaving(false);
          return;
        }
      } else if (entry.type === 'url' && entry.value.trim()) {
        resolvedUrls.push(entry.value.trim());
      }
    }

    // Only keep sizes with both a label and a valid price
    const cleanedSizes = sizes.filter(s => s.label.trim() && s.price > 0);
    // Base price is derived from the lowest size price
    const basePrice = Math.min(...cleanedSizes.map(s => s.price));

    const payload = {
      name: form.name,
      description: form.description,
      price: basePrice,
      sale_price: form.sale_price ? toMoney(form.sale_price) : null,
      stock_quantity: 5,
      category_id: form.category_id,
      image_urls: resolvedUrls,
      sizes: cleanedSizes,
    };

    try {
      if (editingProduct) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id);
        showSuccessMessage('Product updated successfully');
      } else {
        const newPayload = {
          ...payload,
          code: nextCode,
        };
        await supabase.from('products').insert(newPayload);
        showSuccessMessage(`Product created successfully with code #${nextCode}`);
      }
      await load();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      setErrorMessage(error.message || 'Failed to save product');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('products').delete().eq('id', id);
      setDeleteId(null);
      showSuccessMessage('Product deleted successfully');
      await load();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setErrorMessage(error.message || 'Failed to delete product');
      setShowError(true);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p as any).categories?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Success Message - Inline */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700"
        >
          <CheckCircle size={18} className="text-emerald-500" />
          <span className="text-sm font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Error Message - Inline */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700"
        >
          <AlertCircle size={18} className="text-red-500" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <button
            onClick={() => setShowError(false)}
            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Product Management</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage your product catalog and inventory</p>
        </div>
        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus size={16} /> Add New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products by name or category..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-200 outline-none text-sm"
        />
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-neutral-100" />
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-50 border-t border-neutral-100" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-xl">
          <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">{search ? 'No products match your search' : 'No products created yet'}</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium mt-2"
            >
              Clear search
            </button>
          )}
          {!search && (
            <button onClick={openCreate} className="mt-6 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02] inline-flex items-center gap-2">
              <Plus size={16} /> Create your first product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden sm:table-cell">
                    Code
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                    Size
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, index) => {
                  const imageUrl = product.image_urls?.[0];
                  const isLowStock = product.stock_quantity < 5;
                  const hasSale = product.sale_price && product.sale_price < product.price;
                  const currentPrice = hasSale ? product.sale_price : product.price;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                              <img 
                                src={imageUrl} 
                                alt={product.name} 
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                              <ImageIcon size={18} className="text-neutral-400" />
                            </div>
                          )}
                          <span className="font-medium text-neutral-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 hidden sm:table-cell">
                        <span className="font-mono inline-flex items-center px-2.5 py-1 rounded-md bg-gold-50 text-gold-700 text-xs font-medium border border-gold-200">
                          #{product.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-900 hidden md:table-cell">
                        {(product as any).categories?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gold-50 text-gold-700 text-xs font-medium border border-gold-200">
                        {product.sizes && product.sizes.length > 0
                          ? product.sizes.map(s => s.label).join(', ')
                          : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div>
                          <span className="font-medium text-neutral-900">
                            ${currentPrice?.toFixed(2)}
                          </span>
                          {hasSale && (
                            <span className="text-xs text-neutral-400 line-through ml-2">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-neutral-700'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete product"
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
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {editingProduct ? 'Update your product details' : 'Add a new product to your store'}
                  </p>
                  {!editingProduct && (
                    <p className="text-xs text-gold-600 mt-1">
                      Auto-generated code: #{nextCode}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors duration-200"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        value={form.name} 
                        onChange={e => {
                          setForm(f => ({ ...f, name: e.target.value }));
                          if (fieldErrors.name && e.target.value.trim()) {
                            setFieldErrors(f => ({ ...f, name: false }));
                          }
                        }}
                        onBlur={() => handleBlur('name')}
                        placeholder="Enter product name"
                        className={`w-full px-4 py-3 bg-neutral-50 border rounded-xl outline-none transition-all duration-200 text-base ${
                          (fieldErrors.name || (touched.name && !form.name.trim()))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/30'
                            : touched.name && form.name.trim()
                            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30'
                            : 'border-neutral-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20'
                        }`}
                      />
                      {touched.name && form.name.trim() && !fieldErrors.name && (
                        <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                      )}
                      {(fieldErrors.name || (touched.name && !form.name.trim())) && (
                        <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                      )}
                    </div>
                    {(fieldErrors.name || (touched.name && !form.name.trim())) && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        Product Name is mandatory
                      </motion.p>
                    )}
                    {touched.name && form.name.trim() && !fieldErrors.name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1"
                      >
                        <CheckCircle size={12} />
                        Valid product name
                      </motion.p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={form.category_id} 
                        onChange={e => {
                          setForm(f => ({ ...f, category_id: e.target.value }));
                          if (fieldErrors.category_id && e.target.value) {
                            setFieldErrors(f => ({ ...f, category_id: false }));
                          }
                        }}
                        onBlur={() => handleBlur('category_id')}
                        className={`w-full px-4 py-3 bg-neutral-50 border rounded-xl outline-none transition-all duration-200 text-base appearance-none ${
                          (fieldErrors.category_id || (touched.category_id && !form.category_id))
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/30'
                            : touched.category_id && form.category_id
                            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30'
                            : 'border-neutral-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20'
                        }`}
                      >
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {touched.category_id && form.category_id && !fieldErrors.category_id && (
                        <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                      )}
                      {(fieldErrors.category_id || (touched.category_id && !form.category_id)) && (
                        <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
                      )}
                    </div>
                    {(fieldErrors.category_id || (touched.category_id && !form.category_id)) && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        Please select a category
                      </motion.p>
                    )}
                    {touched.category_id && form.category_id && !fieldErrors.category_id && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1"
                      >
                        <CheckCircle size={12} />
                        Category selected
                      </motion.p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Sale Price
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={form.sale_price} 
                      onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} 
                      onKeyDown={e => {
                        if (['e', 'E', '+', '-'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Leave blank" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Stock Quantity
                    </label>
                    <input 
                      type="number" 
                      value="5"
                      readOnly
                      disabled
                      className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-neutral-400 mt-1">Stock is set to a default of 5</p>
                  </div>              
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                      rows={3} 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Sizes <span className="text-red-500">*</span> <span className="text-neutral-400 normal-case font-normal">(e.g. 60ML, 120ML with their own prices)</span>
                    </label>
                    <SizesInput
                      sizes={sizes}
                      onChange={next => {
                        setSizes(next);
                        if (showSizeErrors) {
                          const valid = next.length > 0 && next.every(s => s.label.trim() && s.price > 0);
                          if (valid) setShowSizeErrors(false);
                        }
                      }}
                      showErrors={showSizeErrors}
                    />
                    {showSizeErrors && sizes.length === 0 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Add at least one size with a price
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Images
                    </label>
                    <ImageInput entries={imageEntries} onChange={setImageEntries} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-neutral-100">
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="flex-1 py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      editingProduct ? 'Update Product' : 'Create Product'
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)} 
                    className="flex-1 py-3.5 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 max-w-md w-full rounded-2xl shadow-2xl text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDeleteId(null)}
                className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors duration-200"
              >
                <X size={20} className="text-neutral-400" />
              </button>

              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Product?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete this product?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3.5 px-4 border border-neutral-200 bg-white text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3.5 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-500/30"
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
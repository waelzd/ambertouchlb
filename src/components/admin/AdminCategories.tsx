import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon, Search, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '../../types';

const EMPTY = { name: '', slug: '', description: '' };

async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [imageEntry, setImageEntry] = useState<{ type: 'url'; value: string } | { type: 'file'; file: File; preview: string }>({ type: 'url', value: '' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(null);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data as Category[]) ?? []);
    setFilteredCategories((data as Category[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = categories.filter(category => 
        category.name?.toLowerCase().includes(query) ||
        category.slug?.toLowerCase().includes(query)
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setImageEntry({ type: 'url', value: '' });
    setTouched({});
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ 
      name: c.name, 
      slug: c.slug, 
      description: c.description ?? '' 
    });
    setImageEntry({ type: 'url', value: c.image_url ?? '' });
    setTouched({});
    setModalOpen(true);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateField = (field: string, value: string) => {
    if (field === 'name') {
      if (!value.trim()) return 'Category name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 50) return 'Name must be less than 50 characters';
    }
    if (field === 'slug') {
      if (value && !/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and hyphens allowed';
    }
    return '';
  };

  const getFieldError = (field: string) => {
    if (!touched[field]) return '';
    return validateField(field, form[field as keyof typeof form]);
  };

  const isFormValid = () => {
    const nameError = validateField('name', form.name);
    const slugError = validateField('slug', form.slug);
    return !nameError && !slugError;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ name: true, slug: true, description: true });
    
    if (!isFormValid()) {
      return;
    }

    setSaving(true);

    let image_url: string | null = null;
    if (imageEntry.type === 'file') {
      try {
        image_url = await uploadCategoryImage(imageEntry.file);
      } catch (err) {
        console.error('Upload failed:', err);
        setErrorMessage(`Failed to upload ${imageEntry.file.name}`);
        setShowError(true);
        setSaving(false);
        return;
      }
    } else {
      image_url = imageEntry.value.trim() || null;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      image_url,
      description: form.description || null,
    };

    try {
      if (editing) {
        await supabase.from('categories').update(payload).eq('id', editing.id);
        showSuccessMessage('Category updated successfully');
      } else {
        await supabase.from('categories').insert(payload);
        showSuccessMessage('Category created successfully');
      }
      
      await load();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      setErrorMessage(error.message || 'Failed to save category. Please try again.');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('categories').delete().eq('id', id);
      setDeleteId(null);
      showSuccessMessage('Category deleted successfully');
      await load();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setErrorMessage(error.message || 'Failed to delete category');
      setShowError(true);
    }
  };

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
          <h2 className="text-2xl font-bold text-neutral-900">Category Management</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage your product categories and organization</p>
        </div>
        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus size={16} /> Add New Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by category name or slug..."
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
            Found {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'}
          </p>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-neutral-400" />
            </div>
            <p className="text-neutral-500 font-medium">No categories created yet</p>
            <p className="text-sm text-neutral-400 mt-1">Create your first category to organize your products</p>
            <button onClick={openCreate} className="mt-6 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02] inline-flex items-center gap-2">
              <Plus size={16} /> Create your first category
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No categories match your search</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium mt-2"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category, index) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                            <img 
                              src={category.image_url} 
                              alt={category.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                            <ImageIcon size={18} className="text-neutral-400" />
                          </div>
                        )}
                        <span className="font-medium text-neutral-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 hidden sm:table-cell">
                      <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded">
                        {category.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 hidden md:table-cell max-w-xs truncate">
                      {category.description ?? <span className="text-neutral-400 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(category)}
                          className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit category"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(category.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
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
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {editing ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {editing ? 'Update your category details' : 'Add a new category to your store'}
                  </p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors duration-200"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <form onSubmit={handleSave} noValidate className="p-8 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      onBlur={() => handleBlur('name')}
                      placeholder="Enter category name" 
                      className={`w-full px-4 py-3 bg-neutral-50 border rounded-xl outline-none transition-all duration-200 text-base ${
                        getFieldError('name') && touched.name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/30'
                          : touched.name && form.name && !getFieldError('name')
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30'
                          : 'border-neutral-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20'
                      }`}
                      required
                    />
                    {touched.name && form.name && !getFieldError('name') && (
                      <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                    {touched.name && getFieldError('name') && (
                      <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {getFieldError('name') && touched.name && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle size={12} />
                      {getFieldError('name')}
                    </motion.p>
                  )}
                  {touched.name && form.name && !getFieldError('name') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      Valid category name
                    </motion.p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Slug
                  </label>
                  <div className="relative">
                    <input 
                      value={form.slug} 
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      onBlur={() => handleBlur('slug')}
                      placeholder="auto-generated from name" 
                      className={`w-full px-4 py-3 bg-neutral-50 border rounded-xl outline-none transition-all duration-200 text-base font-mono ${
                        getFieldError('slug') && touched.slug && form.slug
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/30'
                          : touched.slug && form.slug && !getFieldError('slug')
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30'
                          : 'border-neutral-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20'
                      }`}
                    />
                    {touched.slug && form.slug && !getFieldError('slug') && (
                      <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                    {touched.slug && form.slug && getFieldError('slug') && (
                      <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {getFieldError('slug') && touched.slug && form.slug && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle size={12} />
                      {getFieldError('slug')}
                    </motion.p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    Leave empty to auto-generate from name
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Image
                  </label>
                  <div 
                    className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-gold-400 transition-all duration-200 cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                  >
                    {imageEntry.type === 'file' ? (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 shrink-0 bg-neutral-100 rounded-xl overflow-hidden">
                          <img src={imageEntry.preview} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-neutral-900 truncate">{imageEntry.file.name}</p>
                          <p className="text-xs text-neutral-400">{(imageEntry.file.size / 1024).toFixed(0)} KB</p>
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
                            setImageEntry({ type: 'url', value: '' });
                          }}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                        >
                          <X size={16} className="text-neutral-400" />
                        </button>
                      </div>
                    ) : imageEntry.value ? (
                      <div className="relative">
                        <img 
                          src={imageEntry.value} 
                          alt="Preview" 
                          className="max-h-40 mx-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageEntry({ type: 'url', value: '' });
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
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (imageEntry.type === 'file') URL.revokeObjectURL(imageEntry.preview);
                        setImageEntry({ type: 'file', file, preview: URL.createObjectURL(file) });
                      }
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    onBlur={() => handleBlur('description')}
                    placeholder="Enter category description" 
                    rows={3} 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base resize-none"
                  />
                </div>

                {/* Actions */}
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
                      editing ? 'Update Category' : 'Create Category'
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
                aria-label="Close modal"
              >
                <X size={20} className="text-neutral-400" />
              </button>

              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Category?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete this category?
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
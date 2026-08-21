import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, X, Edit2, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY = { title: '', subtitle: '', image_url: '', link: '', active: true, sort_order: 0 };

async function uploadBannerImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(null);

  const load = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ 
      title: b.title ?? '', 
      subtitle: b.subtitle ?? '', 
      image_url: b.image_url ?? '', 
      link: b.link ?? '', 
      active: b.active, 
      sort_order: b.sort_order 
    });
    setImagePreview(b.image_url ?? '');
    setImageFile(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let image_url = form.image_url;
    
    if (imageFile) {
      try {
        image_url = await uploadBannerImage(imageFile);
      } catch (err) {
        console.error('Upload failed:', err);
        setErrorMessage(`Failed to upload ${imageFile.name}`);
        setShowError(true);
        setSaving(false);
        return;
      }
    }

    const payload = { ...form, image_url };
    
    try {
      if (editing) {
        await supabase.from('banners').update(payload).eq('id', editing.id);
        showSuccessMessage('Banner updated successfully');
      } else {
        await supabase.from('banners').insert(payload);
        showSuccessMessage('Banner created successfully');
      }
      
      await load();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving banner:', error);
      setErrorMessage(error.message || 'Failed to save banner. Please try again.');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('banners').delete().eq('id', id);
      setDeleteId(null);
      showSuccessMessage('Banner deleted successfully');
      await load();
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      setErrorMessage(error.message || 'Failed to delete banner');
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
          <h2 className="text-2xl font-bold text-neutral-900">Banner Management</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage your homepage banners and promotions</p>
        </div>
        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus size={16} /> Add New Banner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Banners</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{banners.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{banners.filter(b => b.active).length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-bold text-neutral-400 mt-1">{banners.filter(b => !b.active).length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Last Updated</p>
          <p className="text-sm font-medium text-neutral-900 mt-1">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <div className="text-center py-20 bg-white border border-neutral-200 rounded-xl">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-neutral-400" />
          </div>
          <p className="text-neutral-500 font-medium">No banners created yet</p>
          <p className="text-sm text-neutral-400 mt-1">Create your first banner to display on the homepage</p>
          <button onClick={openCreate} className="mt-6 px-6 py-3 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02] inline-flex items-center gap-2">
            <Plus size={16} /> Create your first banner
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group bg-white border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                banner.active ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                {banner.image_url ? (
                  <img 
                    src={banner.image_url} 
                    alt={banner.title ?? ''} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                    <ImageIcon className="w-12 h-12 text-neutral-300" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                  banner.active 
                    ? 'bg-emerald-500/90 text-white' 
                    : 'bg-neutral-500/90 text-white'
                }`}>
                  {banner.active ? 'Active' : 'Inactive'}
                </div>

                {/* Action Buttons Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-3 bg-white rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                  >
                    <Edit2 size={18} className="text-neutral-700" />
                  </button>
                  <button
                    onClick={() => setDeleteId(banner.id)}
                    className="p-3 bg-white rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-neutral-900 line-clamp-1">
                    {banner.title ?? 'Untitled'}
                  </h3>
                  <span className="text-xs text-neutral-400 flex-shrink-0 ml-2 bg-neutral-100 px-2.5 py-1 rounded-full">
                    #{banner.sort_order}
                  </span>
                </div>
                
                {banner.subtitle && (
                  <p className="text-sm text-neutral-500 line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
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
                    {editing ? 'Edit Banner' : 'Create New Banner'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {editing ? 'Update your banner details' : 'Add a new banner to your homepage'}
                  </p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors duration-200"
                >
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    placeholder="Enter banner title" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Subtitle
                  </label>
                  <input 
                    value={form.subtitle} 
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} 
                    placeholder="Enter subtitle" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Banner Image <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                      imagePreview 
                        ? 'border-gold-400 bg-gold-50/30' 
                        : 'border-neutral-200 hover:border-gold-400 hover:bg-gold-50/10'
                    }`}
                    onClick={() => fileRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Banner preview" 
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview('');
                            setImageFile(null);
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
                    onChange={handleFileChange}
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Link URL
                  </label>
                  <input 
                    value={form.link} 
                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))} 
                    placeholder="/shop or https://example.com" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base"
                  />
                </div>

                {/* Sort Order & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Sort Order
                    </label>
                    <input 
                      type="number" 
                      value={form.sort_order} 
                      onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} 
                      placeholder="0" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all duration-200 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <div className="flex items-center gap-3 bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-200 hover:border-gold-400 transition-colors duration-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.active} 
                        onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} 
                        className="w-5 h-5 rounded border-neutral-300 text-gold-400 focus:ring-gold-400 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        {form.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
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
                      editing ? 'Update Banner' : 'Create Banner'
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

              <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Banner?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete this banner?
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
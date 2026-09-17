import React, { useState, useRef } from 'react';
import { MerchandiseItem, CenterType } from '../../types';
import {
  X,
  Plus,
  Trash2,
  FileImage,
  UploadCloud,
  Building2,
  Package,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

interface EditStoreProductModalProps {
  isOpen: boolean;
  product: MerchandiseItem | null;
  onClose: () => void;
  onSave: (productId: string, data: Partial<MerchandiseItem>) => Promise<void>;
  theme: 'dark' | 'light';
}

export const EditStoreProductModal: React.FC<EditStoreProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
  theme,
}) => {
  if (!isOpen || !product) return null;

  const isSupp = product.category === 'Supplements';
  const variants = (isSupp ? product.flavours : product.sizes) ||
    product.flavours_or_choices || ['Standard'];

  const [price, setPrice] = useState<number | ''>(product.price);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(product.original_price || '');
  const [description, setDescription] = useState(product.description || '');
  const [badge, setBadge] = useState(product.badge || '');

  // Images
  const initialImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variant Stocks
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>(() => {
    if (product.variant_stocks && Object.keys(product.variant_stocks).length > 0) {
      return { ...product.variant_stocks };
    }
    const initial: Record<string, number> = {};
    variants.forEach((v) => {
      initial[v] = Math.max(1, Math.floor((product.stock || 10) / variants.length));
    });
    return initial;
  });

  // Centers
  const [selectedCenters, setSelectedCenters] = useState<(CenterType | 'All')[]>(
    product.available_centers || ['All']
  );

  const [isSaving, setIsSaving] = useState(false);

  // Handlers
  const processImageFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setImageError('Please select valid image files.');
      return;
    }

    const readers: Promise<string>[] = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setImageUrls((prev) => [...prev, ...results]);
      setImageError('');
    });
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (idx: number) => {
    const updated = imageUrls.filter((_, i) => i !== idx);
    setImageUrls(updated);
    if (updated.length === 0) {
      setImageError('Product must have at least 1 image.');
    }
  };

  const handleStockChange = (variant: string, count: number) => {
    setVariantStocks((prev) => ({
      ...prev,
      [variant]: Math.max(0, count),
    }));
  };

  const toggleCenter = (center: CenterType | 'All') => {
    if (center === 'All') {
      setSelectedCenters(['All']);
      return;
    }
    const filtered = selectedCenters.filter((c) => c !== 'All') as CenterType[];
    if (filtered.includes(center)) {
      const next = filtered.filter((c) => c !== center);
      setSelectedCenters(next.length === 0 ? ['All'] : next);
    } else {
      const next = [...filtered, center];
      setSelectedCenters(next.length === 3 ? ['All'] : next);
    }
  };

  const totalStock = Object.values(variantStocks).reduce((a, b) => a + Number(b || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrls.length === 0) {
      setImageError('At least 1 image is required.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      alert('Valid price is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(product.id, {
        price: Number(price),
        original_price: originalPrice !== '' ? Number(originalPrice) : undefined,
        description: description.trim() || product.description,
        badge: badge.trim() || undefined,
        image_url: imageUrls[0],
        additional_images: imageUrls.length > 1 ? imageUrls.slice(1) : undefined,
        variant_stocks: variantStocks,
        stock: totalStock,
        available_centers: selectedCenters,
      });
      onClose();
    } catch (err) {
      console.error('Error saving store product:', err);
      alert('Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Edit Store Listing</h3>
              <p className="text-xs text-zinc-400">
                Update stock counts, images, and center availability for {product.name}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Images */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <FileImage className="w-4 h-4 text-rose-500" />
              <span>Product Images</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-rose-500" />
                <span>Upload Photos</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleDeviceFileUpload}
                className="hidden"
              />
              <input
                type="url"
                placeholder="Or paste image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Add
              </button>
            </div>
            {imageError && <p className="text-xs text-rose-400 font-bold">{imageError}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 group">
                  <img src={url} alt="img" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-zinc-300 hover:text-red-400"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variant Stocks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Variant Inventory Count</span>
              </label>
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                Total: {totalStock} units
              </span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/60">
              {variants.map((v) => (
                <div key={v} className="p-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">{v}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Stock:</span>
                    <input
                      type="number"
                      min={0}
                      value={variantStocks[v] ?? 0}
                      onChange={(e) => handleStockChange(v, Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Selling Price (₹)</label>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">M.R.P. (₹ for discount calculation)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Center Availability */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Center Availability</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['All', 'Ranaghat', 'Chakdah', 'Madanpur'] as const).map((c) => {
                const active = selectedCenters.includes(c) || (c !== 'All' && selectedCenters.includes('All'));
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCenter(c)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {c === 'All' ? 'All Centers' : `${c} Center`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge & Description */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Deal Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Certified Authentic, Bestseller"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

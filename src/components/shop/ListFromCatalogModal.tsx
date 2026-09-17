import React, { useState, useRef } from 'react';
import { CatalogItem, CenterType, MerchandiseItem } from '../../types';
import {
  X,
  Plus,
  Upload,
  UploadCloud,
  FileImage,
  Building2,
  Trash2,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

interface ListFromCatalogModalProps {
  isOpen: boolean;
  catalogItem: CatalogItem | null;
  onClose: () => void;
  onListProduct: (productData: Omit<MerchandiseItem, 'id'>) => void;
  theme: 'dark' | 'light';
  defaultCenter?: string;
}

export const ListFromCatalogModal: React.FC<ListFromCatalogModalProps> = ({
  isOpen,
  catalogItem,
  onClose,
  onListProduct,
  theme,
  defaultCenter,
}) => {
  if (!isOpen || !catalogItem) return null;

  const isSupp = catalogItem.category === 'Supplements';
  const variants = catalogItem.variants && catalogItem.variants.length > 0
    ? catalogItem.variants
    : isSupp
    ? ['Double Rich Chocolate', 'Vanilla Ice Cream']
    : ['Standard'];

  // 1. Images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Variant-wise Stock Counts (dictionary: { "Double Rich Chocolate": 10, ... })
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variants.forEach((v) => {
      initial[v] = 10;
    });
    return initial;
  });

  // 3. Center Availability
  const [selectedCenters, setSelectedCenters] = useState<CenterType[]>(() => {
    if (defaultCenter && defaultCenter !== 'All' && ['Ranaghat', 'Chakdah', 'Madanpur'].includes(defaultCenter)) {
      return [defaultCenter as CenterType];
    }
    return ['Ranaghat', 'Chakdah', 'Madanpur'];
  });
  const [isAllCenters, setIsAllCenters] = useState(true);

  // Optional Badge / MRP
  const [badge, setBadge] = useState('Certified Authentic');
  const [originalPrice, setOriginalPrice] = useState<number | ''>(Math.round(catalogItem.price * 1.25));

  // Image upload processor
  const processImageFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setImageError('Please select valid image files (PNG, JPG, JPEG, WEBP).');
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

  const handleAddImageFromUrl = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl('');
    setImageError('');
  };

  const handleRemoveImage = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated);
  };

  const handleStockChange = (variant: string, count: number) => {
    setVariantStocks((prev) => ({
      ...prev,
      [variant]: Math.max(0, count),
    }));
  };

  const handleToggleCenter = (c: CenterType) => {
    if (isAllCenters) {
      setIsAllCenters(false);
      setSelectedCenters([c]);
      return;
    }
    if (selectedCenters.includes(c)) {
      const next = selectedCenters.filter((item) => item !== c);
      if (next.length === 0) {
        setIsAllCenters(true);
        setSelectedCenters(['Ranaghat', 'Chakdah', 'Madanpur']);
      } else {
        setSelectedCenters(next);
      }
    } else {
      const next = [...selectedCenters, c];
      if (next.length === 3) {
        setIsAllCenters(true);
      }
      setSelectedCenters(next);
    }
  };

  const handleToggleAllCenters = () => {
    if (isAllCenters) {
      setIsAllCenters(false);
      setSelectedCenters(['Ranaghat']);
    } else {
      setIsAllCenters(true);
      setSelectedCenters(['Ranaghat', 'Chakdah', 'Madanpur']);
    }
  };

  const totalStock = Object.values(variantStocks).reduce((a, b) => a + Number(b || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (imageUrls.length === 0 || !imageUrls[0]?.trim()) {
      setImageError('Please add at least 1 product image before publishing to the center store.');
      return;
    }

    const availableCenters: (CenterType | 'All')[] = isAllCenters ? ['All'] : selectedCenters;

    onListProduct({
      catalog_id: catalogItem.id,
      name: catalogItem.name,
      category: catalogItem.category,
      price: catalogItem.price,
      original_price: originalPrice !== '' ? Number(originalPrice) : undefined,
      description: catalogItem.description || `${catalogItem.name} stocked directly from official Hercules Gym inventory.`,
      image_url: imageUrls[0],
      additional_images: imageUrls.length > 1 ? imageUrls.slice(1) : undefined,
      flavours: isSupp ? variants : undefined,
      sizes: !isSupp ? variants : undefined,
      flavours_or_choices: variants,
      variant_stocks: variantStocks,
      stock: totalStock,
      badge: badge.trim() || undefined,
      available_centers: availableCenters,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase">
                {catalogItem.category}
              </span>
              <h3 className="text-lg font-black tracking-tight text-white">List in Center Store</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Adding <strong className="text-white">{catalogItem.name}</strong> (₹{catalogItem.price.toLocaleString()}) to gym center inventory.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-5">
          {/* Section 1: Product Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-rose-500" />
                <span>1. Product Images</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400 font-medium">
                {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processImageFiles(e.dataTransfer.files);
                }
              }}
              className={`p-4 rounded-2xl border-2 border-dashed text-center transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-rose-500 bg-rose-500/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-rose-500" />
              <div className="text-xs text-zinc-300">
                Drag & drop product photos, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-rose-400 font-bold hover:underline"
                >
                  browse device
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">Supports PNG, JPG, WEBP formats</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleDeviceFileUpload}
                className="hidden"
              />
            </div>

            {/* URL input fallback */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Or paste direct image URL (https://...)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddImageFromUrl}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URL</span>
              </button>
            </div>

            {/* Error banner */}
            {imageError && (
              <p className="text-xs text-rose-400 font-bold bg-rose-950/60 border border-rose-500/30 p-2 rounded-xl">
                {imageError}
              </p>
            )}

            {/* Image Previews */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-rose-600/90 text-white text-[9px] font-black text-center py-0.5 uppercase">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Variant-wise Product Stock Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>2. Product Stock Count according to {isSupp ? 'Flavours' : 'Sizes / Choices'}</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                Total Stock: {totalStock} units
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800/60">
              {variants.map((v) => (
                <div key={v} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-white">{v}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Stock count:</span>
                    <input
                      type="number"
                      min={0}
                      value={variantStocks[v] ?? 0}
                      onChange={(e) => handleStockChange(v, Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Center Availability */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>3. Center Availability</span>
              <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleToggleAllCenters}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  isAllCenters
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                All 3 Centers
              </button>

              {(['Ranaghat', 'Chakdah', 'Madanpur'] as CenterType[]).map((c) => {
                const active = isAllCenters || selectedCenters.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCenter(c)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'bg-zinc-800 text-white border-rose-500/50 shadow-sm'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {c} Center
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional: Deal Badge & MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Deal Badge (Optional)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Certified Authentic, Bestseller"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">M.R.P. for discount calculation (Optional)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 7999"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-950/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Product to Store</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

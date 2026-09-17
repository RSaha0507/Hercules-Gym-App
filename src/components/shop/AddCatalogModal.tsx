import React, { useState } from 'react';
import { CatalogItem } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  IndianRupee,
  FileText,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface AddCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCatalogItem: (item: Omit<CatalogItem, 'id' | 'created_at'>) => Promise<any>;
  theme: 'dark' | 'light';
}

export const AddCatalogModal: React.FC<AddCatalogModalProps> = ({
  isOpen,
  onClose,
  onAddCatalogItem,
  theme,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Supplements' | 'Apparel' | 'Accessories' | 'Equipment'>('Supplements');
  const [price, setPrice] = useState<number | ''>(2499);
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<string[]>([
    'Double Rich Chocolate',
    'Vanilla Ice Cream',
    'Café Mocha',
  ]);
  const [newVariantInput, setNewVariantInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isSupp = category === 'Supplements';

  const handleCategoryChange = (newCat: 'Supplements' | 'Apparel' | 'Accessories' | 'Equipment') => {
    setCategory(newCat);
    if (newCat === 'Supplements') {
      setVariants(['Double Rich Chocolate', 'Vanilla Ice Cream', 'Café Mocha', 'Cookies & Cream']);
    } else if (newCat === 'Apparel') {
      setVariants(['S', 'M', 'L', 'XL', 'XXL']);
    } else if (newCat === 'Accessories') {
      setVariants(['Standard', 'Heavy-Duty Pro', 'Adjustable Size']);
    } else {
      setVariants(['Standard Set', 'Pro Heavy Edition']);
    }
  };

  const handleAddVariant = () => {
    if (!newVariantInput.trim()) return;
    const clean = newVariantInput.trim();
    if (!variants.includes(clean)) {
      setVariants([...variants, clean]);
    }
    setNewVariantInput('');
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) {
      alert('At least one variant/flavour/size is required.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product Name is required.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      alert('A valid base price is required.');
      return;
    }
    if (variants.length === 0) {
      alert(isSupp ? 'Please add at least one flavour.' : 'Please add at least one choice/size.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCatalogItem({
        name: name.trim(),
        category,
        price: Number(price),
        description: description.trim() || undefined,
        variants,
      });

      // Reset
      setName('');
      setPrice(2499);
      setDescription('');
      setVariants(['Double Rich Chocolate', 'Vanilla Ice Cream', 'Café Mocha']);
      onClose();
    } catch (err) {
      console.error('Error adding catalog item:', err);
      alert('Failed to add catalog item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl transition-all my-8 ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black tracking-tight">Add Master Catalog Product</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Admin Master Catalog definition (Trainers & Admins can then list this into any center store).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - strictly 5 parameters */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* 1. Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <span>1. Product Name</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Optimum Nutrition Gold Standard 5LBS 100% Whey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 2. Product Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <span>2. Product Category</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Supplements', 'Apparel', 'Accessories', 'Equipment'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    category === cat
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Product Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Product Price (₹)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="e.g. 6499"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 4. Product Description (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>4. Product Description</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 24g protein isolate per scoop, 5.5g BCAAs, clinically proven muscle synthesis."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* 5. Product Variants (Flavours for supplements, Choices/Sizes for others) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-400" />
                <span>5. Product Variants ({isSupp ? 'Flavours' : 'Choices / Sizes'})</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-zinc-400">{variants.length} defined</span>
            </label>

            {/* Quick add input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isSupp ? 'Add flavour (e.g. Cookies & Cream)' : 'Add size/choice (e.g. XL or Heavy)'}
                value={newVariantInput}
                onChange={(e) => setNewVariantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariant();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Chips list */}
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 min-h-12 max-h-32 overflow-y-auto">
              {variants.map((v, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                >
                  <span>{v}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-950/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save to Master Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

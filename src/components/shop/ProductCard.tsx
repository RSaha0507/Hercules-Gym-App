import React, { useState } from 'react';
import { MerchandiseItem, Role } from '../../types';
import {
  Star,
  Building2,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Edit3,
  Trash2,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface ProductCardProps {
  product: MerchandiseItem;
  theme: 'dark' | 'light';
  userRole?: Role;
  userCenter?: string;
  cartQuantity: number;
  onAddToCart: (product: MerchandiseItem, variant?: string) => void;
  onUpdateCartQty: (productId: string, qty: number) => void;
  onEditProduct?: (product: MerchandiseItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onQuickStockChange?: (productId: string, variant: string, newQty: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  theme,
  userRole,
  userCenter,
  cartQuantity,
  onAddToCart,
  onUpdateCartQty,
  onEditProduct,
  onDeleteProduct,
  onQuickStockChange,
}) => {
  const isStaff = userRole === 'admin' || userRole === 'trainer';
  const isAdmin = userRole === 'admin';
  const isDark = theme === 'dark';

  // Multi-image state
  const allImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const currentImg = allImages[activeImgIdx] || product.image_url;

  // Variants calculation
  const isSupp = product.category === 'Supplements' || product.category?.toLowerCase() === 'supplements';
  let variants: string[] = [];
  if (isSupp) {
    if (product.flavours && product.flavours.length > 0) {
      variants = product.flavours;
    } else if (product.flavours_or_choices && product.flavours_or_choices.length > 0) {
      variants = product.flavours_or_choices;
    } else {
      variants = ['Double Rich Chocolate', 'Vanilla Ice Cream'];
    }
  } else {
    if (product.sizes && product.sizes.length > 0) {
      variants = product.sizes;
    } else if (product.flavours_or_choices && product.flavours_or_choices.length > 0) {
      variants = product.flavours_or_choices;
    } else {
      variants = product.category === 'Apparel' ? ['S', 'M', 'L', 'XL'] : ['Standard'];
    }
  }

  const [selectedVariant, setSelectedVariant] = useState<string>(variants[0] || '');

  // Stock calculation for selected variant
  const variantStocks = product.variant_stocks || {};
  const hasVariantStockData = Object.keys(variantStocks).length > 0;
  const currentVariantStock = hasVariantStockData
    ? (variantStocks[selectedVariant] ?? (product.stock > 0 ? 5 : 0))
    : product.stock;

  const isOutOfStock = currentVariantStock <= 0;
  const isLowStock = currentVariantStock > 0 && currentVariantStock <= 3;

  // Price calculations (Flipkart/Amazon style)
  const effectivePrice = product.price;
  const originalPrice = product.original_price || Math.round(effectivePrice * 1.25);
  const discountPercent = originalPrice > effectivePrice
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
    : 15;

  // Center display
  const centerText = product.available_centers?.includes('All')
    ? 'All Centers'
    : product.available_centers?.join(', ') || 'Ranaghat';

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row group overflow-hidden relative ${
        isDark
          ? 'bg-[#18181b] border-zinc-800 hover:border-zinc-700 hover:shadow-2xl hover:shadow-rose-950/20'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xl'
      }`}
    >
      {/* Left Media Column (Amazon / Flipkart Search Style) */}
      <div className="sm:w-56 md:w-64 lg:w-72 shrink-0 bg-zinc-950 flex flex-col justify-between relative border-b sm:border-b-0 sm:border-r border-zinc-800/80">
        {/* Main Product Image Frame */}
        <div className="relative h-56 sm:h-full min-h-[220px] w-full flex items-center justify-center p-3">
          <img
            src={currentImg}
            alt={product.name}
            className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Center Availability Pill on top right of image */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2 py-0.5 rounded-md bg-zinc-950/85 text-zinc-300 border border-zinc-800 text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
              <Building2 className="w-3 h-3 text-rose-500" />
              {centerText}
            </span>
          </div>

          {/* Out of stock watermark if fully out */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-xl">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Multi-Image Gallery Thumbnails strip */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-1.5 p-2 bg-zinc-950/90 border-t border-zinc-800/80 overflow-x-auto justify-center">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImgIdx(idx)}
                className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-zinc-900 ${
                  activeImgIdx === idx ? 'border-rose-500 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Product Details & Actions Column */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-2">
          {/* Header Row: Category Tag & Staff Controls */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
              {product.category}
            </span>

            {/* Staff Controls (Admin/Trainer Edit & Delete) */}
            {isStaff && (
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                {onEditProduct && (
                  <button
                    type="button"
                    title="Edit Store Listing & Variant Stock"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProduct(product);
                    }}
                    className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAdmin && onDeleteProduct && (
                  <button
                    type="button"
                    title="Remove from Store"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Remove "${product.name}" from store inventory?`)) {
                        onDeleteProduct(product.id);
                      }
                    }}
                    className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Product Title */}
          <h3 className={`text-base font-bold leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {product.name}
          </h3>

          {/* Badges and Highlights Row (Moved in place of former rating div) */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.badge ? (
              <span className="px-2 py-0.5 rounded bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                {product.badge}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-400" />
                Gym Deal
              </span>
            )}

            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Authentic
            </span>

            <span className="text-[10px] font-bold text-amber-400 ml-auto flex items-center gap-0.5">
              <Zap className="w-3 h-3 fill-amber-400" />
              HG Direct
            </span>
          </div>

          {/* Pricing Block (Amazon / Flipkart Layout) */}
          <div className="pt-1 flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl font-black text-rose-500">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-zinc-500 line-through font-medium">
              M.R.P: ₹{originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          </div>

          {/* Product Description */}
          {product.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Interactive Variant Selection (Flavours for Supplements, Sizes/Choices for others) */}
          {variants.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-zinc-400 uppercase tracking-wider">
                  {isSupp ? 'Select Flavour:' : 'Select Size / Choice:'}
                </span>
                <span className="font-semibold text-zinc-300">
                  {selectedVariant}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {variants.map(variant => {
                  const isSelected = selectedVariant === variant;
                  const vStock = variantStocks[variant] ?? (hasVariantStockData ? 0 : product.stock);
                  const isVOutOfStock = vStock <= 0;

                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 relative ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-md'
                          : isVOutOfStock
                          ? 'bg-zinc-950/50 text-zinc-600 border border-zinc-800 line-through'
                          : isDark
                          ? 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                      <span>{variant}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-time Inventory Status Indicator */}
          <div className="flex items-center justify-between text-xs pt-1">
            {isOutOfStock ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Currently Out of Stock for {selectedVariant}
              </span>
            ) : isLowStock ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Hurry, only {currentVariantStock} left in {userCenter || 'Gym'}!
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                In Stock ({currentVariantStock} available)
              </span>
            )}

            {/* Staff Variant Stock Quick Adjuster */}
            {isStaff && onQuickStockChange && (
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5">
                <span className="text-[10px] text-zinc-500 mr-1">Qty:</span>
                <button
                  type="button"
                  title="Decrease Qty"
                  onClick={() => onQuickStockChange(product.id, selectedVariant, Math.max(0, currentVariantStock - 1))}
                  className="text-zinc-400 hover:text-white p-0.5"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-amber-400">{currentVariantStock}</span>
                <button
                  type="button"
                  title="Increase Qty"
                  onClick={() => onQuickStockChange(product.id, selectedVariant, currentVariantStock + 1)}
                  className="text-zinc-400 hover:text-white p-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer (Flipkart / Amazon Call-To-Action) */}
        <div className="pt-3 border-t border-zinc-800/60">
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-zinc-950 border border-rose-500/50 rounded-xl p-1.5">
              <span className="text-xs font-bold text-rose-400 pl-2">
                In Cart: <strong className="text-white">{cartQuantity}</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateCartQty(product.id, cartQuantity - 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center font-bold transition-all active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-mono font-bold text-sm text-white">{cartQuantity}</span>
                <button
                  type="button"
                  disabled={isOutOfStock || cartQuantity >= currentVariantStock}
                  onClick={() => onUpdateCartQty(product.id, cartQuantity + 1)}
                  className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white flex items-center justify-center font-bold transition-all active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product, selectedVariant)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-950/30 transition-all active:scale-98"
            >
              <ShoppingCart className="w-4 h-4 text-zinc-950" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

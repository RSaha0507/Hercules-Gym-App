import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { MerchandiseItem, CenterType } from '../types';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sparkles,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Filter,
  X,
  Package,
  PlusCircle,
  Tag,
  Building2,
  Layers,
  Image as ImageIcon,
  Check,
  AlertCircle,
} from 'lucide-react';

export const ShopView: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    orders,
    currentUser,
    selectedCenter,
    theme,
  } = useGym();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash_at_desk' | 'card'>('upi');
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Selected flavor/choice per product { productId: selectedChoice }
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  // Selected image index per product { productId: activeImgIdx }
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  // Admin Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'Supplements' | 'Apparel' | 'Accessories' | 'Equipment'>('Supplements');
  const [isPriceRange, setIsPriceRange] = useState(false);
  const [prodPriceMin, setProdPriceMin] = useState<number | ''>(2499);
  const [prodPriceMax, setProdPriceMax] = useState<number | ''>(2999);
  const [prodDescription, setProdDescription] = useState('');
  const [prodStock, setProdStock] = useState<number>(15);
  const [prodBadge, setProdBadge] = useState('Certified Authentic');

  // Image list (at least 1 mandatory)
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Flavours / Choices list (at least 1 mandatory)
  const [choicesList, setChoicesList] = useState<string[]>(['Double Rich Chocolate', 'Vanilla Ice Cream', 'Café Mocha']);
  const [newChoiceInput, setNewChoiceInput] = useState('');

  // Intended branch target selection (4 options: All centers, Ranaghat, Chakdah, Madanpur)
  const [branchTarget, setBranchTarget] = useState<'All' | 'Ranaghat' | 'Chakdah' | 'Madanpur'>('All');

  const categories = ['All', 'Supplements', 'Apparel', 'Accessories', 'Equipment'];

  // Filter products based on user branch & role
  const isUserAdmin = currentUser?.role === 'admin';
  const userCenter = currentUser?.center || 'Ranaghat';

  const visibleProducts = products.filter(p => {
    // Branch isolation:
    // If admin, show all (or respect global filter if chosen)
    if (!isUserAdmin) {
      const isVisibleForBranch =
        p.available_centers.includes('All') ||
        p.available_centers.includes(userCenter);
      if (!isVisibleForBranch) return false;
    }

    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const desc = p.description || '';
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.flavours && p.flavours.some((f: string) => f.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (p.sizes && p.sizes.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (p.flavours_or_choices && p.flavours_or_choices.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleAddChoice = () => {
    if (!newChoiceInput.trim()) return;
    if (!choicesList.includes(newChoiceInput.trim())) {
      setChoicesList([...choicesList, newChoiceInput.trim()]);
    }
    setNewChoiceInput('');
  };

  const handleRemoveChoice = (index: number) => {
    if (choicesList.length <= 1) {
      alert('At least one flavor / choice option is mandatory.');
      return;
    }
    setChoicesList(choicesList.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls([...imageUrls, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (imageUrls.length <= 1) {
      alert('At least one product image is mandatory.');
      return;
    }
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert('Product Name is mandatory.');
      return;
    }
    if (prodPriceMin === '' || Number(prodPriceMin) <= 0) {
      alert('A valid product price is mandatory.');
      return;
    }
    if (imageUrls.length === 0 || !imageUrls[0].trim()) {
      alert('At least one product image is mandatory.');
      return;
    }
    if (choicesList.length === 0) {
      alert('At least one flavor / choice option is mandatory.');
      return;
    }

    const minP = Number(prodPriceMin);
    const maxP = isPriceRange && prodPriceMax !== '' ? Number(prodPriceMax) : undefined;

    const availableCenters: (CenterType | 'All')[] =
      branchTarget === 'All' ? ['All'] : [branchTarget];

    addProduct({
      name: prodName.trim(),
      category: prodCategory,
      price: minP,
      price_min: isPriceRange ? minP : undefined,
      price_max: maxP,
      stock: Number(prodStock) || 0,
      description: prodDescription.trim() || `${prodName} stocked for Hercules Gym members.`,
      image_url: imageUrls[0],
      additional_images: imageUrls.length > 1 ? imageUrls.slice(1) : undefined,
      flavours: prodCategory === 'Supplements' ? choicesList : undefined,
      sizes: prodCategory !== 'Supplements' ? choicesList : undefined,
      badge: prodBadge.trim() || undefined,
      available_centers: availableCenters,
    });

    // Reset Form
    setShowAddModal(false);
    setProdName('');
    setProdPriceMin(2499);
    setProdPriceMax(2999);
    setIsPriceRange(false);
    setProdDescription('');
    setProdStock(15);
    setImageUrls(['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80']);
    setChoicesList(['Double Rich Chocolate', 'Vanilla Ice Cream', 'Café Mocha']);
    setBranchTarget('All');
  };

  const handleAddToCartWithChoice = (prod: MerchandiseItem) => {
    const choices = prod.flavours || prod.sizes || [];
    const selectedChoice = selectedChoices[prod.id] || (choices.length > 0 ? choices[0] : undefined);
    addToCart(prod, 1, selectedChoice);
  };

  const handleCompleteOrder = () => {
    const placed = placeOrder(paymentMethod);
    setOrderSuccess(placed);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Hercules Store & Supplements</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600/20 text-rose-400 border border-rose-600/30 text-[10px] font-black uppercase tracking-wider">
              {isUserAdmin ? 'Admin Inventory Matrix' : `${userCenter} Branch Store`}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Certified authentic supplements, gym apparel, and powerlifting accessories
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Add Product Button */}
          {isUserAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-900/30 transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95 shrink-0 relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Cart</span>
            {cart.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-rose-600 font-extrabold text-[10px]">
                {cart.reduce((a, c) => a + c.quantity, 0)} (₹{cartTotal})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-rose-600 text-white shadow-md'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplements, gear, flavours..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Branch notice if non-admin */}
      {!isUserAdmin && (
        <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-500" />
            <span>Showing authentic inventory available for collection at <strong>{userCenter} Center</strong>.</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold">100% In-Stock Verification</span>
        </div>
      )}

      {/* Products Grid */}
      {visibleProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-zinc-950/60 space-y-3">
          <Package className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-zinc-300">No merchandise found in this category</div>
          <p className="text-xs text-zinc-500">Try changing category filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map(prod => {
            const allImages = [prod.image_url, ...(prod.additional_images || [])];
            const activeImgIdx = activeImageIndices[prod.id] || 0;
            const currentImg = allImages[activeImgIdx] || prod.image_url;
            const choices = prod.flavours || prod.sizes || [];
            const activeChoice = selectedChoices[prod.id] || (choices.length > 0 ? choices[0] : '');

            const branchLabel = prod.available_centers.includes('All')
              ? 'All Centers'
              : prod.available_centers.join(', ');

            return (
              <div
                key={prod.id}
                className={`rounded-3xl border overflow-hidden flex flex-col transition-all hover:border-rose-500/40 hover:shadow-xl group ${
                  theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                {/* Image Section with Multi-Image previews */}
                <div className="relative h-52 bg-zinc-950 overflow-hidden flex flex-col justify-end">
                  <img
                    src={currentImg}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {prod.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        {prod.badge}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-900/80 text-amber-400 border border-amber-500/30 text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {branchLabel}
                    </span>
                  </div>

                  {/* Stock Counter Tag */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md ${
                        prod.stock > 5
                          ? 'bg-zinc-950/80 text-emerald-400 border border-emerald-500/30'
                          : prod.stock > 0
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-950/90 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {prod.stock > 0 ? `Gym Stock: ${prod.stock} left` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Multi-Image Thumbnails if available */}
                  {allImages.length > 1 && (
                    <div className="relative z-10 p-2 flex items-center gap-1.5 overflow-x-auto bg-zinc-950/70 backdrop-blur-sm">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setActiveImageIndices({
                              ...activeImageIndices,
                              [prod.id]: idx,
                            })
                          }
                          className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            activeImgIdx === idx ? 'border-rose-500 scale-105' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img src={img} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">
                        {prod.category}
                      </span>

                      {/* Admin Quick Stock Adjuster */}
                      {isUserAdmin && (
                        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                          <button
                            type="button"
                            title="Decrease Stock"
                            onClick={() => updateProductStock(prod.id, prod.stock - 1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-mono font-bold px-1 text-white">{prod.stock}</span>
                          <button
                            type="button"
                            title="Increase Stock"
                            onClick={() => updateProductStock(prod.id, prod.stock + 1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete Product"
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${prod.name} from the store?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-rose-400 ml-1 border-l border-zinc-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">{prod.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{prod.description}</p>

                    {/* Flavours / Choices Chips (Mandatory Selection) */}
                    {choices.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {prod.category === 'Supplements' ? 'Select Flavour:' : 'Select Size / Option:'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {choices.map((choice: string) => (
                            <button
                              key={choice}
                              type="button"
                              onClick={() =>
                                setSelectedChoices({
                                  ...selectedChoices,
                                  [prod.id]: choice,
                                })
                              }
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                activeChoice === choice
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-white">
                        {prod.price_max && prod.price_max > prod.price ? (
                          <span>
                            ₹{prod.price.toLocaleString()} – ₹{prod.price_max.toLocaleString()}
                          </span>
                        ) : (
                          <span>₹{prod.price.toLocaleString()}</span>
                        )}
                      </div>
                      {prod.original_price && (
                        <div className="text-[11px] text-zinc-500 line-through">
                          ₹{prod.original_price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCartWithChoice(prod)}
                      disabled={prod.stock === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{prod.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 my-8 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black">Add Product to Store & Supplements</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="py-4 space-y-4 text-xs">
              {/* Product Name (Mandatory) */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="e.g. Optimum Nutrition Gold Standard Whey 2kg"
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={e => setProdCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  >
                    <option value="Supplements">Supplements</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>

                {/* Gym Available Stock Counter (Mandatory) */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Gym Stock Counter <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProdStock(Math.max(0, prodStock - 1))}
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      required
                      value={prodStock}
                      onChange={e => setProdStock(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setProdStock(prodStock + 1)}
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price or Price Range (Mandatory) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-bold">
                    Product Pricing <span className="text-rose-500">*</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-400">
                    <input
                      type="checkbox"
                      checked={isPriceRange}
                      onChange={e => setIsPriceRange(e.target.checked)}
                      className="accent-rose-600 rounded"
                    />
                    <span>Allow Price Range (Min – Max)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-400 mb-1 block">
                      {isPriceRange ? 'Minimum Price (₹)' : 'Fixed Price (₹)'}
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={prodPriceMin}
                      onChange={e => setProdPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 2499"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {isPriceRange && (
                    <div>
                      <span className="text-[11px] text-zinc-400 mb-1 block">Maximum Price (₹)</span>
                      <input
                        type="number"
                        min={Number(prodPriceMin) || 1}
                        value={prodPriceMax}
                        onChange={e => setProdPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 2999"
                        className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Images (At least one mandatory, option for more) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-rose-500" />
                    <span>Product Images <span className="text-rose-500">* (at least 1 required)</span></span>
                  </label>
                  <span className="text-[11px] text-zinc-500">{imageUrls.length} image(s) added</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="Enter additional Image URL (e.g. https://...)"
                    className="flex-1 p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                  >
                    + Add Image
                  </button>
                </div>

                {/* Image List Preview */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-700">
                      <img src={url} alt="prod" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-rose-600/90 text-[8px] font-black text-white text-center py-0.5">
                          MAIN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flavours / Choices / Sizes (Mandatory - at least one, option to add more) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>
                      {prodCategory === 'Supplements' ? 'Flavours' : 'Sizes / Choices'}{' '}
                      <span className="text-rose-500">* (at least 1 required)</span>
                    </span>
                  </label>
                  <span className="text-[11px] text-zinc-500">{choicesList.length} options</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChoiceInput}
                    onChange={e => setNewChoiceInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChoice();
                      }
                    }}
                    placeholder={
                      prodCategory === 'Supplements'
                        ? 'e.g. Double Rich Chocolate, Strawberry...'
                        : 'e.g. S, M, L, XL, 10mm...'
                    }
                    className="flex-1 p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChoice}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {choicesList.map((ch, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <span>{ch}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(idx)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Intended Branches (4 options: All centers, Ranaghat, Chakdah, Madanpur) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <label className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Intended Branch Visibility <span className="text-rose-500">*</span></span>
                </label>
                <p className="text-[11px] text-zinc-400">
                  Select which center branch members will have access to purchase this product.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(['All', 'Ranaghat', 'Chakdah', 'Madanpur'] as const).map(branch => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => setBranchTarget(branch)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        branchTarget === branch
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {branch === 'All' ? 'All Centers' : `${branch}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Description (Optional) */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1">Product Description (Optional)</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={e => setProdDescription(e.target.value)}
                  placeholder="e.g. 24g 100% Whey Protein with 5.5g BCAAs and 4g Glutamine per serving."
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black shadow-xl shadow-rose-900/30 transition-all"
                >
                  Publish to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className={`w-full max-w-md h-full flex flex-col shadow-2xl p-6 ${
            theme === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black">Shopping Bag</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 text-zinc-500 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-zinc-300">Your Cart is Empty</h4>
                <p className="text-xs text-zinc-500">
                  Select protein supplements, lifting straps, or merchandise from the store.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cart.map(item => (
                    <div
                      key={`${item.product.id}-${item.size || 'std'}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
                        {item.size && (
                          <div className="text-[10px] text-amber-400 font-bold">Choice: {item.size}</div>
                        )}
                        <div className="text-xs text-rose-400 font-bold">₹{item.product.price}</div>

                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-semibold">Subtotal</span>
                    <span className="font-black text-white">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Gym Member Pickup Verification</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-zinc-800 pt-2">
                    <span>Total Amount</span>
                    <span className="text-rose-500">₹{cartTotal.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-xl shadow-rose-900/30 transition-all"
                  >
                    Proceed to Payment (₹{cartTotal.toLocaleString()})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black">Checkout & Order Placement</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Pickup Location</div>
                  <div className="text-zinc-400">{userCenter} Front Desk Reception</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400">Total Due</div>
                  <div className="text-base font-black text-rose-500">₹{cartTotal.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-2">Select Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-rose-500" />
                    <span>Instant UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_at_desk')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'cash_at_desk'
                        ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-400" />
                    <span>Pay Cash at Desk</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                  <div className="w-32 h-32 bg-white p-2 rounded-2xl mx-auto flex items-center justify-center">
                    <div className="w-full h-full border-4 border-zinc-900 p-1 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 bg-zinc-900" />
                        <div className="w-6 h-6 bg-zinc-900" />
                      </div>
                      <div className="text-[9px] font-mono font-bold text-zinc-900 text-center">
                        HERCULES GYM
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 bg-zinc-900" />
                        <div className="w-4 h-4 bg-zinc-900 ml-auto" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500">Scan using GPay, PhonePe, or Paytm</p>
                </div>
              )}

              <button
                onClick={handleCompleteOrder}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/30 transition-all"
              >
                Confirm Order & Generate Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Placed Success Alert */}
      {orderSuccess && (
        <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Order #{orderSuccess.id} Placed Successfully!
              </div>
              <div className="text-[11px] text-zinc-400">
                Ready for collection at {orderSuccess.center} front desk. Total: ₹{orderSuccess.total_amount}
              </div>
            </div>
          </div>

          <button
            onClick={() => setOrderSuccess(null)}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

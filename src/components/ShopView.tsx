import React, { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { MerchandiseItem, CatalogItem, CenterType } from '../types';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  QrCode,
  Banknote,
  Search,
  X,
  Package,
  Layers,
  Building2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import {
  ProductCard,
  CatalogSidebar,
  AddCatalogModal,
  ListFromCatalogModal,
  EditStoreProductModal,
} from './shop';

export const ShopView: React.FC = () => {
  const {
    products,
    catalog,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    placeOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    addCatalogItem,
    deleteCatalogItem,
    currentUser,
    theme,
    activeTab,
    setActiveTab,
  } = useGym();

  const userRole = currentUser?.role;
  const isStaff = userRole === 'admin' || userRole === 'trainer';
  const isAdmin = userRole === 'admin';
  const userCenter = currentUser?.center || 'Ranaghat';

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(activeTab === 'shop/cart' || activeTab === 'cart');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash_at_desk' | 'card'>('upi');
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile drawer for Master Catalog Sidebar
  const [showCatalogSidebarMobile, setShowCatalogSidebarMobile] = useState<boolean>(false);

  // Modals state
  const [showAddCatalogModal, setShowAddCatalogModal] = useState<boolean>(false);
  const [selectedCatalogItemForListing, setSelectedCatalogItemForListing] = useState<CatalogItem | null>(null);
  const [editingStoreProduct, setEditingStoreProduct] = useState<MerchandiseItem | null>(null);

  // Sync isCartOpen with activeTab
  useEffect(() => {
    if (activeTab === 'shop/cart' || activeTab === 'cart') {
      setIsCartOpen(true);
    } else {
      setIsCartOpen(false);
    }
  }, [activeTab]);

  const handleOpenCart = () => {
    setActiveTab('shop/cart');
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    if (activeTab === 'shop/cart' || activeTab === 'cart') {
      setActiveTab('shop');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter store products based on user branch & role & search
  const visibleProducts = products.filter((p: MerchandiseItem) => {
    if (!isAdmin) {
      const isVisibleForBranch =
        p.available_centers.includes('All') ||
        p.available_centers.includes(userCenter as CenterType);
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

  const cartTotal = cart.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);

  const handleAddToCart = (prod: MerchandiseItem, variant?: string) => {
    addToCart(prod, 1, variant);
    showToast(`Added ${prod.name}${variant ? ` (${variant})` : ''} to bag!`);
  };

  const handleQuickStockChange = (productId: string, variant: string, newQty: number) => {
    const targetProduct = products.find((p: MerchandiseItem) => p.id === productId);
    if (!targetProduct) return;

    const currentVariantStocks = targetProduct.variant_stocks || {};
    const updatedStocks = {
      ...currentVariantStocks,
      [variant]: Math.max(0, newQty),
    };
    const newTotalStock = Object.values(updatedStocks).reduce((a: number, b: number) => a + Number(b || 0), 0);

    updateProduct(productId, {
      variant_stocks: updatedStocks,
      stock: newTotalStock,
    });
    showToast(`Updated stock for ${variant}: ${newQty} units`);
  };

  const handleListProductFromCatalog = (productData: Omit<MerchandiseItem, 'id'>) => {
    addProduct(productData);
    showToast(`"${productData.name}" is now listed live in the gym center store!`);
    setSelectedCatalogItemForListing(null);
  };

  const handleCompleteOrder = () => {
    const placed = placeOrder(paymentMethod);
    setOrderSuccess(placed);
    setIsCheckoutOpen(false);
    handleCloseCart();
  };

  const categories = ['All', 'Supplements', 'Apparel', 'Accessories', 'Equipment'];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-black text-white tracking-tight">Hercules Store & Supplements</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600/20 text-rose-400 border border-rose-600/30 text-[10px] font-black uppercase tracking-wider">
              {isAdmin ? 'Admin Master View (3 Centers)' : isStaff ? `Trainer View (${userCenter})` : `${userCenter} Member Store`}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Certified authentic sports nutrition, official apparel, lifting belts, and high-performance equipment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mobile Master Catalog Trigger (Staff Only) */}
          {isStaff && (
            <button
              onClick={() => setShowCatalogSidebarMobile(!showCatalogSidebarMobile)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-950/30 transition-transform active:scale-95 shrink-0"
            >
              <Layers className="w-4 h-4" />
              <span>Catalog ({catalog.length})</span>
            </button>
          )}

          {/* Cart Trigger Button */}
          <button
            onClick={handleOpenCart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95 shrink-0 relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Bag</span>
            {cart.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-rose-600 font-extrabold text-[10px]">
                {cart.reduce((a: number, c: any) => a + c.quantity, 0)} (₹{cartTotal.toLocaleString()})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-emerald-400 hover:text-white rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area: Products Grid + Master Catalog Sidebar on Right (Staff Only) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Store Category Filters, Search Bar & Product Cards */}
        <div className="flex-1 w-full space-y-5 min-w-0">
          {/* Category Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {categories.map((cat: string) => (
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Member Center Notice */}
          {!isAdmin && (
            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-500" />
                <span>
                  Showing inventory available for collection at <strong>{userCenter} Center</strong>.
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% In-Stock Verification
              </span>
            </div>
          )}

          {/* Amazon / Flipkart Style Product Cards List */}
          {visibleProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-zinc-950/60 space-y-3">
              <Package className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="text-sm font-bold text-zinc-300">No merchandise currently listed in this category</div>
              <p className="text-xs text-zinc-500">
                {isStaff
                  ? 'Select an item from the Master Catalog on the right to list it in this center store!'
                  : 'Check back soon or ask the gym reception.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {visibleProducts.map((prod: MerchandiseItem) => {
                const inCartItem = cart.find((c: any) => c.product.id === prod.id);
                const cartQty = inCartItem?.quantity || 0;

                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    theme={theme}
                    userRole={userRole}
                    userCenter={userCenter}
                    cartQuantity={cartQty}
                    onAddToCart={handleAddToCart}
                    onUpdateCartQty={(pid: string, qty: number) => updateCartQuantity(pid, qty)}
                    onEditProduct={(p: MerchandiseItem) => setEditingStoreProduct(p)}
                    onDeleteProduct={(pid: string) => deleteProduct(pid)}
                    onQuickStockChange={handleQuickStockChange}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Master Catalog Sidebar (Strictly visible for Admin & Trainers) */}
        {isStaff && (
          <>
            {/* Desktop Docked Sidebar on Right */}
            <div className="hidden lg:block shrink-0 sticky top-4">
              <CatalogSidebar
                catalog={catalog}
                userRole={userRole}
                theme={theme}
                onOpenAddCatalogModal={() => setShowAddCatalogModal(true)}
                onListInStore={(item: CatalogItem) => setSelectedCatalogItemForListing(item)}
                onDeleteCatalogItem={(id: string) => deleteCatalogItem(id)}
              />
            </div>

            {/* Mobile Drawer */}
            {showCatalogSidebarMobile && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex justify-end">
                <div className="w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 p-4 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-black text-white">Master Catalog</h3>
                    </div>
                    <button
                      onClick={() => setShowCatalogSidebarMobile(false)}
                      className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pt-3">
                    <CatalogSidebar
                      catalog={catalog}
                      userRole={userRole}
                      theme={theme}
                      onOpenAddCatalogModal={() => {
                        setShowCatalogSidebarMobile(false);
                        setShowAddCatalogModal(true);
                      }}
                      onListInStore={(item: CatalogItem) => {
                        setShowCatalogSidebarMobile(false);
                        setSelectedCatalogItemForListing(item);
                      }}
                      onDeleteCatalogItem={(id: string) => deleteCatalogItem(id)}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Only: Add Product to Master Catalog Modal (Strictly 5 fields) */}
      <AddCatalogModal
        isOpen={showAddCatalogModal}
        onClose={() => setShowAddCatalogModal(false)}
        onAddCatalogItem={async (item: Omit<CatalogItem, 'id' | 'created_at'>) => {
          await addCatalogItem(item);
          showToast(`"${item.name}" added to Master Catalog!`);
        }}
        theme={theme}
      />

      {/* Staff (Admin / Trainer): List Product from Catalog to Center Store Modal */}
      <ListFromCatalogModal
        isOpen={Boolean(selectedCatalogItemForListing)}
        catalogItem={selectedCatalogItemForListing}
        onClose={() => setSelectedCatalogItemForListing(null)}
        onListProduct={handleListProductFromCatalog}
        theme={theme}
        defaultCenter={userCenter}
      />

      {/* Staff (Admin / Trainer): Edit Store Product Modal */}
      <EditStoreProductModal
        isOpen={Boolean(editingStoreProduct)}
        product={editingStoreProduct}
        onClose={() => setEditingStoreProduct(null)}
        onSave={async (pid: string, updates: Partial<MerchandiseItem>) => {
          await updateProduct(pid, updates);
          showToast(`Store listing updated!`);
        }}
        theme={theme}
      />

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div
            className={`w-full max-w-md h-full flex flex-col shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseCart}
                  title="Go back to store"
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black">Shopping Bag</h3>
              </div>
              <button
                onClick={handleCloseCart}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 text-zinc-500 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-zinc-300">Your Bag is Empty</h4>
                <p className="text-xs text-zinc-500">
                  Select protein supplements, lifting straps, or merchandise from the store.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cart.map((item: any) => (
                    <div
                      key={`${item.product.id}-${item.size || 'std'}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-zinc-950 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
                        {item.size && (
                          <div className="text-[10px] text-amber-400 font-bold">Choice: {item.size}</div>
                        )}
                        <div className="text-xs text-rose-400 font-bold">₹{item.product.price.toLocaleString()}</div>

                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold font-mono">{item.quantity}</span>
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
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-xl shadow-rose-900/30 transition-all active:scale-98"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black">Checkout & Order Placement</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
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
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
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
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-400" />
                    <span>Pay Cash at Desk</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
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
                  <p className="text-[10px] text-zinc-500">Scan using UPI apps (GPay, PhonePe, etc.)</p>
                </div>
              )}

              <button
                onClick={handleCompleteOrder}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/30 transition-all active:scale-98"
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
                Ready for collection at {orderSuccess.center} front desk. Total: ₹{orderSuccess.total_amount?.toLocaleString()}
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

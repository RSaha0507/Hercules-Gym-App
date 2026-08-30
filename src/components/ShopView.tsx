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

  const categories = ['All', 'Supplements', 'Apparel', 'Accessories', 'Equipment'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCompleteOrder = () => {
    const placed = placeOrder(paymentMethod);
    setOrderSuccess(placed);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Cart Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Hercules Store & Supplements</h2>
          <p className="text-xs text-zinc-400">
            Certified authentic supplements, gym apparel, and powerlifting gear
          </p>
        </div>

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
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(prod => (
          <div
            key={prod.id}
            className={`rounded-3xl border overflow-hidden flex flex-col transition-all hover:border-rose-500/40 hover:shadow-xl group ${
              theme === 'dark' ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            <div className="relative h-48 bg-zinc-950 overflow-hidden">
              <img
                src={prod.image_url}
                alt={prod.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {prod.badge && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                  {prod.badge}
                </span>
              )}
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950/80 text-zinc-300 text-[10px] font-semibold backdrop-blur-md">
                Stock: {prod.stock} left
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">
                  {prod.category}
                </span>
                <h3 className="text-sm font-bold text-white leading-snug">{prod.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{prod.description}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-white">₹{prod.price}</div>
                  {prod.original_price && (
                    <div className="text-[11px] text-zinc-500 line-through">₹{prod.original_price}</div>
                  )}
                </div>

                <button
                  onClick={() => addToCart(prod)}
                  disabled={prod.stock === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{prod.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
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
                    <span className="font-black text-white">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Gym Member Pickup Discount</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-zinc-800 pt-2">
                    <span>Total Amount</span>
                    <span className="text-rose-500">₹{cartTotal}</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-xl shadow-rose-900/30 transition-all"
                  >
                    Proceed to Payment (₹{cartTotal})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal with Simulated UPI QR & Cash at Desk */}
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
                  <div className="text-zinc-400">{currentUser?.center || 'Ranaghat'} Front Desk</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400">Total Due</div>
                  <div className="text-base font-black text-rose-500">₹{cartTotal}</div>
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
                    {/* Visual QR Code Representation */}
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
                  <p className="text-[11px] text-zinc-400">
                    UPI ID: <span className="font-mono font-bold text-white">herculesgym@icici</span>
                  </p>
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

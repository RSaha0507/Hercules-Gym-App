import React, { useState } from 'react';
import { CatalogItem, Role } from '../../types';
import {
  Layers,
  Plus,
  PlusCircle,
  Search,
  Tag,
  Store,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight,
  Package,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface CatalogSidebarProps {
  catalog: CatalogItem[];
  userRole?: Role;
  theme: 'dark' | 'light';
  onOpenAddCatalogModal: () => void;
  onListInStore: (catalogItem: CatalogItem) => void;
  onDeleteCatalogItem?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
  catalog,
  userRole,
  theme,
  onOpenAddCatalogModal,
  onListInStore,
  onDeleteCatalogItem,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const isAdmin = userRole === 'admin';
  const isDark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Supplements', 'Apparel', 'Accessories', 'Equipment'];

  const filteredCatalog = catalog.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.variants && item.variants.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  return (
    <aside
      className={`rounded-3xl border flex flex-col transition-all duration-300 ${
        isDark
          ? 'bg-[#121215] border-zinc-800 text-white'
          : 'bg-zinc-50 border-zinc-200 text-zinc-900'
      } ${isCollapsed ? 'w-14 items-center p-2' : 'w-full lg:w-96 p-4.5'}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black tracking-tight uppercase">Master Catalog</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                {catalog.length}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              3 Centers (Ranaghat, Chakdah, Madanpur)
            </p>
          </div>
        </div>

        {/* Admin Add to Catalog Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAddCatalogModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] shadow-md shadow-amber-950/30 transition-transform active:scale-95 shrink-0"
            title="Add New Product Definition to Master Catalog"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Catalog</span>
          </button>
        )}
      </div>

      {/* Role notice banner */}
      <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-[11px] text-zinc-300 flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">
            {isAdmin ? 'Admin Master View' : 'Trainer Inventory View'}:
          </span>{' '}
          Select any master catalog item below and click{' '}
          <strong className="text-white">"Add to Store"</strong> to list it with photos & stock for any center.
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="mt-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog master items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Master Catalog Products List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-280px)] pr-1">
        {filteredCatalog.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <Package className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-400">No catalog products found</p>
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAddCatalogModal}
                className="text-[11px] text-amber-400 font-bold hover:underline"
              >
                + Add the first product to catalog
              </button>
            )}
          </div>
        ) : (
          filteredCatalog.map((item) => {
            const isSupp = item.category === 'Supplements';
            const variantCount = item.variants?.length || 0;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 group ${
                  isDark
                    ? 'bg-zinc-950/80 border-zinc-800/90 hover:border-amber-500/40 hover:bg-zinc-900/60'
                    : 'bg-white border-zinc-200 hover:border-amber-400 shadow-sm'
                }`}
              >
                <div>
                  {/* Top Category Badge & Price */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        item.category === 'Supplements'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          : item.category === 'Apparel'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          : item.category === 'Accessories'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-400 font-mono">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>

                      {/* Admin Delete Action */}
                      {isAdmin && onDeleteCatalogItem && (
                        <button
                          type="button"
                          title="Delete from Master Catalog"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete "${item.name}" from Master Catalog?`)) {
                              onDeleteCatalogItem(item.id);
                            }
                          }}
                          className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Name */}
                  <h4 className="text-xs font-bold text-white mt-1.5 leading-snug line-clamp-2">
                    {item.name}
                  </h4>

                  {/* Description */}
                  {item.description && (
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Variants Summary */}
                  {item.variants && item.variants.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">
                        {isSupp ? 'Flavours:' : 'Choices:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.variants.slice(0, 3).map((v) => (
                          <span
                            key={v}
                            className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[9px] font-medium"
                          >
                            {v}
                          </span>
                        ))}
                        {item.variants.length > 3 && (
                          <span className="text-[9px] text-amber-400 font-bold">
                            +{item.variants.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA: Add to Center Store */}
                <button
                  type="button"
                  onClick={() => onListInStore(item)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/30 transition-transform active:scale-98"
                >
                  <Store className="w-3.5 h-3.5 text-white" />
                  <span>Add to Center Store</span>
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

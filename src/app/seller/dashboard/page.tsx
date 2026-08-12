'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  AlertTriangle, 
  Calendar, 
  Loader2, 
  Plus, 
  Check, 
  Truck, 
  Clock, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import RoleSwitcherNav from '@/components/RoleSwitcherNav';

interface InventoryVariant {
  id: string;
  type: string;
  value: string;
  stock: number;
  lowStockThreshold: number;
  restockEta: string | null;
  restockNote: string | null;
  product: {
    name: string;
    slug: string;
  };
}

interface SellerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string; email: string };
  items: { id: string; productName: string; variantInfo: string; quantity: number; unitPrice: number }[];
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'add-product'>('inventory');
  const [loading, setLoading] = useState(true);
  
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Inventory Restock Modal States
  const [editingVariant, setEditingVariant] = useState<InventoryVariant | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [restockEta, setRestockEta] = useState<string>('');
  const [restockNote, setRestockNote] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // New Product Form State
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [creatingProd, setCreatingProd] = useState(false);

  const fetchSellerData = async () => {
    try {
      const [ordRes, catRes] = await Promise.all([
        fetch('/api/seller/orders'),
        fetch('/api/products?limit=50'),
      ]);

      const ordData = await ordRes.json();
      const catData = await catRes.json();

      if (ordData.success) setOrders(ordData.orders);
      
      // Collect all variants across seller's products
      if (catData.success && catData.products) {
        const allVars: InventoryVariant[] = [];
        catData.products.forEach((p: any) => {
          if (p.variants) {
            p.variants.forEach((v: any) => {
              allVars.push({
                ...v,
                product: { name: p.name, slug: p.slug },
              });
            });
          }
        });
        setVariants(allVars);
      }
    } catch (err) {
      console.error('Error loading seller dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
    fetch('/api/products?limit=100').then((r) => r.json()).then((d) => {
      if (d.products) {
        const uniqueCats = Array.from(new Set(d.products.map((p: any) => JSON.stringify(p.category))))
          .map((c: any) => JSON.parse(c))
          .filter(Boolean);
        setCategories(uniqueCats);
      }
    });
  }, []);

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setUpdating(true);

    try {
      const res = await fetch('/api/seller/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: editingVariant.id,
          stock: newStock,
          restockEta: restockEta || null,
          restockNote: restockNote || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Inventory updated successfully.');
        setEditingVariant(null);
        fetchSellerData();
      } else {
        toast.error(data.error || 'Failed to update inventory');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    const courier = nextStatus === 'SHIPPED' ? window.prompt('Courier Partner Name (e.g. BlueDart):') : undefined;
    const tracking = nextStatus === 'SHIPPED' ? window.prompt('Tracking Number:') : undefined;

    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
          courierPartner: courier || undefined,
          trackingNumber: tracking || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Order status updated to ${nextStatus.toLowerCase()}`);
        fetchSellerData();
      } else {
        toast.error(data.error || 'Status transition failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProd(true);

    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          categoryId: prodCat || categories[0]?.id,
          price: prodPrice,
          images: [prodImg || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'],
          variants: [{ type: 'standard', value: 'Default', stock: parseInt(prodStock, 10) }],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Product created successfully!');
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setProdImg('');
        setActiveTab('inventory');
        fetchSellerData();
      } else {
        toast.error(data.error || 'Failed to create product');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingProd(false);
    }
  };

  const formatPrice = (paiseVal: number) => (paiseVal / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.status !== 'CANCELLED' ? curr.total : 0), 0);
  const lowStockItems = variants.filter((v) => v.stock <= v.lowStockThreshold);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />

      {/* Universal Top Navigation Header */}
      <RoleSwitcherNav />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Page Title */}
        <div className="mb-8 border-b border-black pb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
            Seller Store Portal
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight">
            Inventory & Catalog Control
          </h1>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Store Revenue</p>
            <h3 className="font-display text-3xl font-black text-amber-600 mt-2">{formatPrice(totalRevenue)}</h3>
          </div>
          <div className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Active Live Catalogs</p>
            <h3 className="font-display text-3xl font-black mt-2">{variants.length} Items</h3>
          </div>
          <div className="border border-neutral-200 p-6 rounded-2xl bg-rose-50/30 border-rose-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stock Refill Alerts</span>
            </p>
            <h3 className="font-display text-3xl font-black text-rose-600 mt-2">
              {lowStockItems.length} Refill Needed
            </h3>
          </div>
        </div>

        {/* Stock Refill Notification Alert Banner */}
        {lowStockItems.length > 0 && (
          <div className="mb-10 p-6 border-2 border-rose-600 bg-rose-50/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="font-display font-black text-lg uppercase tracking-tight">
                Refill Stock Action Required ({lowStockItems.length} Variants)
              </h3>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              The items below are out of stock or low in inventory. Set a restock ETA date or text note so customers know when they will be back!
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setEditingVariant(item);
                    setNewStock(item.stock);
                    setRestockEta(item.restockEta ? item.restockEta.split('T')[0] : '');
                    setRestockNote(item.restockNote || '');
                  }}
                  className="bg-white border border-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-900 hover:bg-rose-600 hover:text-white transition-colors"
                >
                  {item.product?.name} ({item.value}) — Stock: {item.stock}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Tabs Selector */}
        <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto gap-8 justify-between items-center">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'inventory' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Table ({variants.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'orders' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Queue ({orders.length})</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('add-product')}
            className="mb-3 border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-200">
                  <th className="p-4">Product Catalog Name</th>
                  <th className="p-4">Variant</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4">Restock ETA / Note</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {variants.map((v) => {
                  const isOutOfStock = v.stock === 0;
                  const isLowStock = v.stock > 0 && v.stock <= v.lowStockThreshold;

                  return (
                    <tr key={v.id} className="hover:bg-neutral-50/50">
                      <td className="p-4 font-bold">{v.product?.name}</td>
                      <td className="p-4 text-neutral-500 uppercase">{v.type}: {v.value}</td>
                      <td className="p-4 font-display font-black text-sm">{v.stock}</td>
                      <td className="p-4">
                        {isOutOfStock ? (
                          <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-rose-200">
                            Out of Stock (Refill Needed)
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-amber-200">
                            Low Stock (&lt;={v.lowStockThreshold})
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-neutral-500 text-[11px]">
                        {v.restockEta ? (
                          <span className="flex items-center gap-1 font-semibold text-black">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>ETA: {new Date(v.restockEta).toLocaleDateString()}</span>
                          </span>
                        ) : v.restockNote ? (
                          <span className="italic font-medium text-amber-800">{v.restockNote}</span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setEditingVariant(v);
                            setNewStock(v.stock);
                            setRestockEta(v.restockEta ? v.restockEta.split('T')[0] : '');
                            setRestockNote(v.restockNote || '');
                          }}
                          className="border border-neutral-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-black"
                        >
                          Refill / Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Refill Inventory Modal */}
        {editingVariant && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 w-full max-w-md space-y-4">
              <h3 className="font-display font-extrabold text-lg uppercase">
                Inventory Refill: {editingVariant.product?.name} ({editingVariant.value})
              </h3>

              <form onSubmit={handleUpdateInventory} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">New Stock Count</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full border border-neutral-200 rounded-lg p-3 text-sm font-bold"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                  <p className="text-[10px] font-bold uppercase text-amber-800">Restock Communication (Displayed to Customers)</p>
                  
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Expected Restock Date</label>
                    <input
                      type="date"
                      className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs bg-white"
                      value={restockEta}
                      onChange={(e) => setRestockEta(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">Restock Text Note (e.g. "after Diwali", "in 2 days")</label>
                    <input
                      type="text"
                      placeholder="e.g. after Diwali"
                      className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs bg-white"
                      value={restockNote}
                      onChange={(e) => setRestockNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingVariant(null)}
                    className="flex-1 border border-neutral-200 py-3 rounded-lg text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-black text-white py-3 rounded-lg text-xs font-bold uppercase hover:bg-neutral-800"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Order Queue */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <p className="text-sm text-neutral-400 font-light">No customer orders received yet.</p>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="border border-neutral-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Order #{ord.orderNumber}</span>
                      <h4 className="font-display font-bold text-base mt-0.5">{ord.user?.name}</h4>
                    </div>
                    <span className="font-display font-extrabold text-lg text-amber-600">{formatPrice(ord.total)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase text-neutral-400">Current Status:</span>
                    <span className="bg-black text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                      {ord.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                    {ord.status === 'PAYMENT_SUCCESSFUL' && (
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'ACCEPTED')} className="bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase">
                        Accept Order
                      </button>
                    )}
                    {ord.status === 'ACCEPTED' && (
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'PACKED')} className="bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase">
                        Mark Packed
                      </button>
                    )}
                    {ord.status === 'PACKED' && (
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'SHIPPED')} className="bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Ship Order</span>
                      </button>
                    )}
                    {ord.status === 'SHIPPED' && (
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'OUT_FOR_DELIVERY')} className="bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase">
                        Out for Delivery
                      </button>
                    )}
                    {ord.status === 'OUT_FOR_DELIVERY' && (
                      <button onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')} className="bg-emerald-600 text-white px-4 py-2 rounded text-xs font-bold uppercase">
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Create Product Form */}
        {activeTab === 'add-product' && (
          <div className="max-w-xl mx-auto border border-neutral-200 p-8 rounded-2xl bg-white shadow-sm">
            <h3 className="font-display font-extrabold text-xl uppercase mb-6">Create New Listing</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black"
                  placeholder="e.g. Linen Suit Jacket"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black"
                    placeholder="4999"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Image URL</label>
                <input
                  type="url"
                  className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black"
                  placeholder="https://..."
                  value={prodImg}
                  onChange={(e) => setProdImg(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={creatingProd}
                className="w-full bg-black text-white py-4 rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                {creatingProd ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Publish Product</span>}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

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
  Star,
  Video,
  Layers,
  DollarSign
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'reviews' | 'add-product'>('inventory');
  const [loading, setLoading] = useState(true);
  
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Restock Modal
  const [editingVariant, setEditingVariant] = useState<InventoryVariant | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [restockEta, setRestockEta] = useState<string>('');
  const [restockNote, setRestockNote] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // New Product Form
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodVideo, setProdVideo] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodWeight, setProdWeight] = useState('500');
  const [prodDimensions, setProdDimensions] = useState('30x20x10');
  const [prodShipping, setProdShipping] = useState('100');
  const [variantType, setVariantType] = useState('Size');
  const [variantValue, setVariantValue] = useState('M');
  const [creatingProd, setCreatingProd] = useState(false);

  const fetchSellerData = async () => {
    try {
      const [ordRes, catRes, revRes] = await Promise.all([
        fetch('/api/seller/orders'),
        fetch('/api/products?limit=50'),
        fetch('/api/reviews'),
      ]);

      const ordData = await ordRes.json();
      const catData = await catRes.json();
      const revData = await revRes.json();

      if (ordData.success) setOrders(ordData.orders || []);
      if (revData.success) setReviews(revData.reviews || []);
      
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

      if (res.ok) {
        toast.success('Inventory updated successfully.');
        setEditingVariant(null);
        fetchSellerData();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
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
          price: prodPrice,
          images: [prodImg || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'],
          video: prodVideo || undefined,
          weight: parseInt(prodWeight, 10) || 500,
          dimensions: prodDimensions,
          shippingCharge: parseInt(prodShipping, 10) * 100 || 10000,
          variants: [{ type: variantType.toLowerCase(), value: variantValue, stock: parseInt(prodStock, 10) }],
        }),
      });

      if (res.ok) {
        toast.success('Product with variant created successfully!');
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setActiveTab('inventory');
        fetchSellerData();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingProd(false);
    }
  };

  const formatPrice = (paiseVal: number) => (paiseVal / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.status !== 'CANCELLED' ? curr.total : 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'PLACED' || o.status === 'PAYMENT_SUCCESSFUL' || o.status === 'ACCEPTED');
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

      <RoleSwitcherNav />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Title */}
        <div className="mb-8 border-b border-black pb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
            Seller Store Portal
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight">
            Seller Control Center
          </h1>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Total Store Revenue</span>
            <h3 className="font-display text-3xl font-black text-amber-600 mt-1">{formatPrice(totalRevenue)}</h3>
          </div>
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Total Orders</span>
            <h3 className="font-display text-3xl font-black mt-1">{orders.length}</h3>
          </div>
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Pending Processing</span>
            <h3 className="font-display text-3xl font-black mt-1 text-blue-600">{pendingOrders.length}</h3>
          </div>
          <div className="border border-neutral-200 p-5 rounded-2xl bg-rose-50/30 border-rose-200">
            <span className="text-[10px] font-bold uppercase text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Inventory Alerts</span>
            </span>
            <h3 className="font-display text-3xl font-black text-rose-600 mt-1">{lowStockItems.length} Refill Needed</h3>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto gap-8 justify-between items-center">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'inventory' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory ({variants.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'orders' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Queue ({orders.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeTab === 'reviews' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>Customer Reviews</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('add-product')}
            className="mb-3 border border-black px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-200">
                  <th className="p-4">Product</th>
                  <th className="p-4">Variant Type & Value</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {variants.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-bold">{v.product?.name}</td>
                    <td className="p-4 text-neutral-500 uppercase">{v.type}: {v.value}</td>
                    <td className="p-4 font-display font-black text-sm">{v.stock}</td>
                    <td className="p-4">
                      {v.stock === 0 ? (
                        <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Out of Stock</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">In Stock</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setEditingVariant(v); setNewStock(v.stock); }} className="border border-neutral-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-black">
                        Refill Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Create Product Form with Variants */}
        {activeTab === 'add-product' && (
          <div className="max-w-xl mx-auto border border-neutral-200 p-8 rounded-2xl bg-white shadow-sm">
            <h3 className="font-display font-extrabold text-xl uppercase mb-6">Add New Product & Variant</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Product Name</label>
                <input type="text" required className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Description</label>
                <textarea required rows={3} className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Price (₹)</label>
                  <input type="number" required className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Stock</label>
                  <input type="number" required className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                </div>
              </div>

              {/* Variant Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Variant Support</label>
                  <select className="w-full border border-neutral-200 rounded-lg p-3 text-xs bg-white" value={variantType} onChange={(e) => setVariantType(e.target.value)}>
                    <option value="Size">Size (S, M, L, XL)</option>
                    <option value="Color">Color (Red, Blue, Black)</option>
                    <option value="Storage">Storage (128GB, 256GB)</option>
                    <option value="RAM">RAM (8GB, 16GB)</option>
                    <option value="Material">Material (Cotton, Silk)</option>
                    <option value="Custom">Custom Option</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Variant Value</label>
                  <input type="text" required className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" value={variantValue} onChange={(e) => setVariantValue(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Image S3 URL</label>
                <input type="url" className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" placeholder="https://..." value={prodImg} onChange={(e) => setProdImg(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Demonstration Video URL (Bonus)</label>
                <input type="url" className="w-full border border-neutral-200 rounded-lg p-3 text-xs outline-none focus:border-black" placeholder="https://..." value={prodVideo} onChange={(e) => setProdVideo(e.target.value)} />
              </div>

              <button type="submit" disabled={creatingProd} className="w-full bg-black text-white py-4 rounded-lg font-bold uppercase text-xs tracking-wider">
                {creatingProd ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publish Product'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

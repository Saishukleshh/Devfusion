'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  Bell, 
  Heart, 
  Loader2, 
  Download, 
  ShoppingBag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import RoleSwitcherNav from '@/components/RoleSwitcherNav';

interface OrderItem {
  id: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCharge: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface RestockProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  variants: {
    stock: number;
    restockEta: string | null;
    restockNote: string | null;
  }[];
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockProducts, setRestockProducts] = useState<RestockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifiedItems, setNotifiedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadCustomerData() {
      try {
        const [ordersRes, prodsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/products?limit=20'),
        ]);

        const ordersData = await ordersRes.json();
        const prodsData = await prodsRes.json();

        if (ordersData.success) {
          setOrders(ordersData.orders || []);
        }

        // Find products out of stock or restocking soon
        if (prodsData.success && prodsData.products) {
          const outOfStock = prodsData.products.filter((p: any) =>
            p.variants?.some((v: any) => v.stock === 0 || v.restockEta || v.restockNote)
          );
          setRestockProducts(outOfStock);
        }
      } catch (err) {
        console.error('Error loading customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomerData();
  }, []);

  const formatPrice = (paise: number) =>
    (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'PLACED':
      case 'PAYMENT_SUCCESSFUL':
        return 20;
      case 'ACCEPTED':
        return 40;
      case 'PACKED':
        return 60;
      case 'SHIPPED':
        return 80;
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERED':
        return 100;
      default:
        return 10;
    }
  };

  const handleNotifyMe = (productId: string, name: string) => {
    setNotifiedItems((prev) => ({ ...prev, [productId]: true }));
    toast.success(`Registered restock alert for "${name}". We will notify you when back in stock!`);
  };

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
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
              Customer Portal
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight">
              Order History & Inventory Alerts
            </h1>
          </div>
          <Link
            href="/products"
            className="border-brutal bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Section 1: Restock & Stock Availability Panel for Customers */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-amber-600" />
            <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">
              Out-of-Stock & Expected Restock Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restockProducts.length === 0 ? (
              <p className="text-xs text-neutral-400 font-light col-span-full">All store products are currently in stock!</p>
            ) : (
              restockProducts.map((p) => {
                const variant = p.variants[0];
                const restockDate = variant?.restockEta ? new Date(variant.restockEta).toLocaleDateString() : null;
                const restockText = variant?.restockNote || (restockDate ? `Expected on ${restockDate}` : 'Restock in progress');

                return (
                  <div key={p.id} className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50 flex flex-col justify-between space-y-4">
                    <div className="flex gap-4">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=200&auto=format&fit=crop'}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-xl border border-neutral-200"
                      />
                      <div>
                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                          Currently Out of Stock
                        </span>
                        <h4 className="font-display font-bold text-sm mt-1">{p.name}</h4>
                        <p className="text-amber-700 font-display font-black text-sm">{formatPrice(p.price)}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <p className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Restock ETA:</span>
                      </p>
                      <p className="text-xs text-amber-900 font-medium">{restockText}</p>
                    </div>

                    <button
                      onClick={() => handleNotifyMe(p.id, p.name)}
                      disabled={notifiedItems[p.id]}
                      className={`w-full py-2.5 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                        notifiedItems[p.id]
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'border border-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{notifiedItems[p.id] ? 'Alert Registered' : 'Notify Me When Back in Stock'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 2: Order Progress Tracking Queue */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-black" />
            <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">
              My Orders & Delivery Tracking
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="border border-neutral-200 p-12 rounded-2xl text-center bg-white">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg uppercase">No Orders Placed Yet</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-6">Browse our multi-vendor marketplace catalog to place your first order.</p>
              <Link href="/products" className="bg-black text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider inline-block">
                Start Shopping
              </Link>
            </div>
          ) : (
            orders.map((ord) => {
              const progress = getStatusProgress(ord.status);

              return (
                <div key={ord.id} className="border border-neutral-200 p-6 rounded-2xl bg-white shadow-sm space-y-6">
                  {/* Order Top Line */}
                  <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Order #{ord.orderNumber}</span>
                      <p className="text-xs text-neutral-500">Placed on {new Date(ord.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Price</span>
                      <p className="font-display font-extrabold text-xl text-amber-600">{formatPrice(ord.total)}</p>
                    </div>
                  </div>

                  {/* Visual Order Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      <span>Order Placed</span>
                      <span>Accepted</span>
                      <span>Packed</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-black h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Itemized Snapshot */}
                  <div className="space-y-3">
                    {ord.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs p-3 bg-neutral-50 rounded-xl">
                        <div>
                          <p className="font-bold">{item.productName}</p>
                          <p className="text-[10px] text-neutral-500 uppercase">{item.variantInfo} × {item.quantity}</p>
                        </div>
                        <span className="font-display font-bold">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <a
                      href={`/api/orders/${ord.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-neutral-200 hover:border-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Tax Invoice (PDF)</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

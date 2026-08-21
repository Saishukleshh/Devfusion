"use client";

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
  MapPin,
  Tag,
  Gift,
  Eye,
  Sparkles,
  Share2
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

export default function CustomerDashboard() {
  const [activeWidgetTab, setActiveWidgetTab] = useState<'orders' | 'wishlist' | 'coupons' | 'addresses' | 'notifications'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomerData() {
      try {
        const [ordersRes, wishRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/wishlist'),
        ]);

        const ordersData = await ordersRes.json();
        const wishData = await wishRes.json();

        if (ordersData.success) setOrders(ordersData.orders || []);
        if (wishData.success) setWishlist(wishData.items || []);
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

  const handleShareWishlist = () => {
    if (navigator.share) {
      navigator.share({ title: 'My VendorVerse Wishlist', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Wishlist link copied to clipboard!');
    }
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

      <RoleSwitcherNav />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
              Customer Account Hub
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight">
              Customer Dashboard
            </h1>
          </div>
          <Link
            href="/products"
            className="border-brutal bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span>Browse Products</span>
          </Link>
        </div>

        {/* Dashboard Overview Widget Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Active Orders</span>
            <h3 className="font-display text-2xl font-black mt-1 text-amber-600">{orders.length}</h3>
          </div>
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Saved Wishlist</span>
            <h3 className="font-display text-2xl font-black mt-1">{wishlist.length}</h3>
          </div>
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Reward Points</span>
            <h3 className="font-display text-2xl font-black mt-1 text-emerald-600">450 PTS</h3>
          </div>
          <div className="border border-neutral-200 p-5 rounded-2xl bg-neutral-50/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Available Coupons</span>
            <h3 className="font-display text-2xl font-black mt-1">3 Active</h3>
          </div>
        </div>

        {/* Widget Selector Tabs */}
        <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto gap-6">
          <button
            onClick={() => setActiveWidgetTab('orders')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeWidgetTab === 'orders' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>Active Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveWidgetTab('wishlist')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeWidgetTab === 'wishlist' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
          >
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Wishlist ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveWidgetTab('coupons')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeWidgetTab === 'coupons' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Coupons & Rewards</span>
          </button>

          <button
            onClick={() => setActiveWidgetTab('addresses')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${activeWidgetTab === 'addresses' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>
        </div>

        {/* Widget 1: Orders Queue */}
        {activeWidgetTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="border border-neutral-200 p-12 rounded-2xl text-center bg-white">
                <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg uppercase">No Orders Placed Yet</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-6">Browse our store catalog to place your first order.</p>
                <Link href="/products" className="bg-black text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider inline-block">
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="border border-neutral-200 p-6 rounded-2xl bg-white shadow-sm space-y-6">
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

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      <span>Order Placed</span>
                      <span>Accepted</span>
                      <span>Packed</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-black h-full transition-all duration-500" style={{ width: `${getStatusProgress(ord.status)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
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

                  <div className="pt-2">
                    <a
                      href={`/api/orders/${ord.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-neutral-200 hover:border-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors inline-flex"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Tax Invoice (PDF)</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Widget 2: Wishlist Widget */}
        {activeWidgetTab === 'wishlist' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <h3 className="font-display font-bold text-lg uppercase">My Saved Wishlist Items</h3>
              <button
                onClick={handleShareWishlist}
                className="border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 hover:border-black"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Wishlist</span>
              </button>
            </div>

            {wishlist.length === 0 ? (
              <p className="text-xs text-neutral-400 font-light">Your wishlist is empty.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {wishlist.map((item) => (
                  <div key={item.id} className="border border-neutral-200 p-4 rounded-2xl bg-white space-y-3">
                    <img src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'} alt={item.product?.name} className="w-full h-40 object-cover rounded-xl" />
                    <h4 className="font-display font-bold text-sm">{item.product?.name}</h4>
                    <p className="font-display font-black text-amber-600 text-sm">{formatPrice(item.product?.price || 0)}</p>
                    <Link href={`/products/${item.product?.slug}`} className="w-full bg-black text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider block text-center">
                      Move to Cart
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Widget 3: Coupons & Rewards */}
        {activeWidgetTab === 'coupons' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-amber-200 bg-amber-50/50 p-6 rounded-2xl space-y-2">
              <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase">First Purchase Offer</span>
              <h4 className="font-display font-black text-xl">FESTIVE20</h4>
              <p className="text-xs text-neutral-600">Get 20% flat discount on your first order. Min spend ₹1,000.</p>
            </div>
            <div className="border border-neutral-200 bg-white p-6 rounded-2xl space-y-2">
              <span className="bg-black text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase">Free Shipping</span>
              <h4 className="font-display font-black text-xl">FREESHIP</h4>
              <p className="text-xs text-neutral-600">Free delivery on orders above ₹2,000.</p>
            </div>
          </div>
        )}

        {/* Widget 4: Saved Addresses */}
        {activeWidgetTab === 'addresses' && (
          <div className="border border-neutral-200 p-6 rounded-2xl bg-white space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-display font-bold text-sm uppercase">Default Delivery Address</h4>
              <span className="text-[10px] font-bold uppercase bg-neutral-100 px-2.5 py-1 rounded">Primary</span>
            </div>
            <p className="text-xs text-neutral-600 font-light leading-relaxed">
              Rahul Kumar<br />
              Building 4, IIT Bombay Campus, Powai<br />
              Mumbai, Maharashtra - 400076<br />
              Phone: +91 98765 43210
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

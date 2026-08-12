'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Tag, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  variantId: string;
  type: string;
  value: string;
  name: string;
  slug: string;
  image: string;
  price: number; // in paise
  quantity: number;
  savedForLater: boolean;
  stock: number;
}

interface CartSummary {
  subtotal: number;
  shippingCharge: number;
  tax: number;
  total: number;
}

export default function CartPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({ subtotal: 0, shippingCharge: 0, tax: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  
  // Coupon configuration
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setItems(data.cart.items);
        setSummary(data.cart.summary);
      } else {
        if (res.status === 401) {
          router.push('/login?redirectTo=/cart');
        }
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQty = async (cartItemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity: newQty }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchCart();
      } else {
        toast.error(data.error || 'Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Item removed from cart.');
        fetchCart();
      }
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const handleToggleSaveLater = async (cartItemId: string, currentSaved: boolean) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, savedForLater: !currentSaved }),
      });
      if (res.ok) {
        toast.success(currentSaved ? 'Moved to Cart' : 'Saved for later');
        fetchCart();
      }
    } catch (err) {
      console.error('Error toggling saved status:', err);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponLoading(true);

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal: summary.subtotal }),
      });

      const data = await res.json();
      if (res.ok) {
        setDiscountAmount(data.coupon.discountAmount);
        setAppliedCoupon(data.coupon.code);
        toast.success(`Coupon Applied! Discount: ₹${Math.round(data.coupon.discountAmount / 100)}`);
      } else {
        toast.error(data.error || 'Failed to apply coupon');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
    } finally {
      setCouponLoading(false);
    }
  };

  const activeCartItems = items.filter((item) => !item.savedForLater);
  const savedItems = items.filter((item) => item.savedForLater);

  // Compute checkout total with coupon discount applied
  const finalCheckoutTotal = Math.max(0, summary.total - discountAmount);

  const formatPrice = (paiseVal: number) => {
    return (paiseVal / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
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

      {/* Floating Glass Navigation */}
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4">
        <nav className="mx-auto max-w-7xl glass rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter uppercase">
            VENDORVERSE
          </Link>
          <div className="flex gap-4">
            <Link href="/products" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">Catalog</Link>
            <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">Dashboard</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight mb-8">
          Your Shopping Cart
        </h1>

        {activeCartItems.length === 0 ? (
          <div className="text-center py-20 border border-neutral-100 rounded-2xl bg-neutral-50/50 mb-12">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-sm text-neutral-400 font-light mb-6">Your cart is empty.</p>
            <Link href="/products" className="border-brutal bg-black text-white px-8 py-3.5 font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all duration-300">
              Go to Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Items Column */}
            <div className="lg:col-span-8 space-y-6">
              {activeCartItems.map((item) => (
                <div key={item.id} className="border border-neutral-200 p-4 rounded-xl flex gap-4 bg-white shadow-sm">
                  <div className="w-24 h-32 border border-neutral-100 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link href={`/products/${item.slug}`}>
                          <h3 className="font-display font-bold text-sm uppercase tracking-tight hover:text-amber-600 transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <span className="font-display font-bold text-sm whitespace-nowrap">{formatPrice(item.price)}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
                        {item.type}: {item.value}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-neutral-200 rounded-lg">
                        <button 
                          onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                          className="p-2 hover:bg-neutral-50 rounded-l-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                          className="p-2 hover:bg-neutral-50 rounded-r-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                        <button 
                          onClick={() => handleToggleSaveLater(item.id, false)}
                          className="text-neutral-400 hover:text-black transition-colors"
                        >
                          Save for Later
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-neutral-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 border border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 space-y-6">
              <h3 className="font-display font-extrabold text-lg uppercase">Order Summary</h3>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="COUPON CODE"
                    required
                    className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs bg-white uppercase font-bold tracking-wider outline-none focus:border-black"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={couponLoading}
                  className="border border-black hover:bg-black hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span className="font-semibold text-amber-800">Coupon "{appliedCoupon}" Applied</span>
                  <span className="font-bold text-amber-800">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-3 text-xs border-y border-neutral-200 py-4">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(summary.subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>Estimated Shipping</span>
                  <span>{summary.shippingCharge === 0 ? 'FREE' : formatPrice(summary.shippingCharge)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Estimated Tax (GST 18%)</span>
                  <span>{formatPrice(summary.tax)}</span>
                </div>
              </div>

              {/* Final total */}
              <div className="flex justify-between items-baseline pt-2">
                <span className="font-display font-bold text-sm uppercase">Total</span>
                <span className="font-display font-black text-2xl text-amber-600">
                  {formatPrice(finalCheckoutTotal)}
                </span>
              </div>

              <Link 
                href={`/checkout?coupon=${appliedCoupon || ''}`}
                className="w-full border-brutal bg-black text-white py-4 rounded-lg font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Save for later section */}
        {savedItems.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight mb-6">
              Saved for Later
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {savedItems.map((item) => (
                <div key={item.id} className="border border-neutral-200 p-4 rounded-xl flex gap-4 bg-white shadow-sm">
                  <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg grayscale flex-shrink-0" />
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-xs uppercase">{item.name}</h4>
                      <p className="text-[9px] text-neutral-400 mt-0.5">{item.type}: {item.value}</p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider mt-2">
                      <button 
                        onClick={() => handleToggleSaveLater(item.id, true)}
                        className="text-amber-600 hover:underline"
                      >
                        Move to Cart
                      </button>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-black"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

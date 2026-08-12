'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Truck, ShieldCheck, Loader2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CartSummary {
  subtotal: number;
  shippingCharge: number;
  tax: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [cartSummary, setCartSummary] = useState<CartSummary>({ subtotal: 0, shippingCharge: 0, tax: 0, total: 0 });
  const [discountAmount, setDiscountAmount] = useState(0);

  // Address form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

  const fetchCartDetails = async (coupon: string) => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setCartSummary(data.cart.summary);

        // If coupon applied, fetch discount calculations
        if (coupon) {
          const coupRes = await fetch('/api/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: coupon, subtotal: data.cart.summary.subtotal }),
          });
          const coupData = await coupRes.json();
          if (coupRes.ok) {
            setDiscountAmount(coupData.coupon.discountAmount);
          }
        }
      } else {
        router.push('/login?redirectTo=/checkout');
      }
    } catch (err) {
      console.error('Error fetching checkout details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const coupon = urlSearchParams.get('coupon') || '';
    setCouponCode(coupon);
    fetchCartDetails(coupon);

    // Dynamically inject Razorpay Standard Web Checkout Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayLoading(true);

    try {
      // 1. Create a shipping Address record first (or mock save directly for simplicity of demo)
      // Since our API expects a shippingAddressId, we will mock write one or create a mock Address ID UUID
      const mockAddressId = 'mock-shipping-address-uuid-12345';

      // 2. Call Razorpay checkout API route to create database Order and get payment details
      const response = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddressId: mockAddressId,
          couponCode: couponCode || undefined,
          paymentMethod,
          notes: `Address: ${addressLine1}, ${city}, ${state} - ${pincode}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate order placement');
      }

      // 3. Handle Cash on Delivery (COD) route immediately
      if (paymentMethod === 'COD') {
        toast.success('Order placed successfully (Cash on Delivery).');
        router.push('/dashboard');
        return;
      }

      // 4. Trigger Razorpay Payment Checkout overlay modal
      const options = {
        key: data.keyId,
        amount: data.amount, // in paise
        currency: 'INR',
        name: 'VendorVerse',
        description: `Checkout Order: ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          // Verify signature on server
          toast.loading('Verifying payment signature...', { id: 'verify-toast' });
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }

            toast.success('Payment Verified! Order completed.', { id: 'verify-toast' });
            router.push('/dashboard');
          } catch (err: any) {
            toast.error(err.message, { id: 'verify-toast' });
          }
        },
        prefill: {
          name: fullName,
          contact: phone,
        },
        theme: {
          color: '#000000',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Payment initiation failed.');
    } finally {
      setPayLoading(false);
    }
  };

  const finalCheckoutTotal = Math.max(0, cartSummary.total - discountAmount);

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
          <Link href="/cart" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight mb-8">
          Checkout Details
        </h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shipping & Payment Address Form */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-neutral-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
              <h3 className="font-display font-extrabold text-lg uppercase pb-3 border-b border-neutral-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>Shipping Address</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Receiver's Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-black"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-black"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-black"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">City</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-black"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">State</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-black"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:border-black"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Options Toggle */}
            <div className="border border-neutral-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
              <h3 className="font-display font-extrabold text-lg uppercase pb-3 border-b border-neutral-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Payment Method</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`border p-4 rounded-xl text-left flex items-start gap-3 transition-colors ${paymentMethod === 'RAZORPAY' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'}`}
                >
                  <input type="radio" checked={paymentMethod === 'RAZORPAY'} onChange={() => {}} className="mt-1 accent-black" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Razorpay Gateway</h4>
                    <p className="text-[10px] text-neutral-400 mt-1">Pay securely via Cards, UPI, Net Banking, or Wallets.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`border p-4 rounded-xl text-left flex items-start gap-3 transition-colors ${paymentMethod === 'COD' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'}`}
                >
                  <input type="radio" checked={paymentMethod === 'COD'} onChange={() => {}} className="mt-1 accent-black" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Cash on Delivery</h4>
                    <p className="text-[10px] text-neutral-400 mt-1">Settle invoice via cash or UPI upon delivery.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Pricing Summary */}
          <div className="lg:col-span-4 border border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 space-y-6">
            <h3 className="font-display font-extrabold text-lg uppercase">Receipt</h3>

            <div className="space-y-3 text-xs border-b border-neutral-200 pb-4">
              <div className="flex justify-between text-neutral-500">
                <span>Items Subtotal</span>
                <span>{formatPrice(cartSummary.subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Shipping Charge</span>
                <span>{cartSummary.shippingCharge === 0 ? 'FREE' : formatPrice(cartSummary.shippingCharge)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Tax (GST 18%)</span>
                <span>{formatPrice(cartSummary.tax)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="font-display font-bold text-sm uppercase">Amount Payable</span>
              <span className="font-display font-black text-2xl text-amber-600">
                {formatPrice(finalCheckoutTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={payLoading}
              className="w-full border-brutal bg-black text-white py-4 rounded-lg font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {payLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Place Order & Pay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

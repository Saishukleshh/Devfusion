'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, ShoppingBag, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone,
          storeName: role === 'SELLER' ? storeName : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Account created successfully!');

      if (role === 'SELLER') {
        router.push('/seller/dashboard');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white text-black p-4 relative font-sans">
      <div className="noise-overlay" />

      <div className="mx-auto w-full max-w-md py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-extrabold text-3xl tracking-tighter inline-flex items-center gap-1.5 mb-6">
            <span>VENDORVERSE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          </Link>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">Create Account</h2>
          <p className="text-xs text-neutral-500 mt-2 font-light">Join as a Customer or Seller to begin</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-neutral-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${role === 'CUSTOMER' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('SELLER')}
            className={`py-3 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${role === 'SELLER' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-black'}`}
          >
            <User className="w-4 h-4" />
            <span>Seller</span>
          </button>
        </div>

        {/* Card Wrapper */}
        <div className="border border-neutral-200 p-6 sm:p-8 rounded-2xl shadow-sm bg-neutral-50/50">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black transition-colors"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Phone Number</label>
              <input
                type="tel"
                className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black transition-colors"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {role === 'SELLER' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black transition-colors"
                  placeholder="My Premium Boutique"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black transition-colors"
                placeholder="•••••••• (Min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full border-brutal bg-black text-white py-3.5 rounded-lg font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-black hover:underline uppercase tracking-wide">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get('redirectTo') || '/');
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      toast.success('Successfully logged in.');

      // Redirect based on role
      if (data.user?.role === 'SELLER') {
        router.push('/seller/dashboard');
      } else if (data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white text-black p-4 relative font-sans">
      <div className="noise-overlay" />

      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-extrabold text-3xl tracking-tighter inline-flex items-center gap-1.5 mb-6">
            <span>VENDORVERSE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          </Link>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">Welcome Back</h2>
          <p className="text-xs text-neutral-500 mt-2 font-light">Enter credentials to access your account</p>
        </div>

        {/* Card wrapper */}
        <div className="border border-neutral-200 p-6 sm:p-8 rounded-2xl shadow-sm bg-neutral-50/50">
          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-black">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                required
                className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black transition-colors"
                placeholder="••••••••"
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
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Credentials Section for Hackathon Demo */}
          <div className="mt-6 pt-4 border-t border-neutral-200 text-xs space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Quick Test Credentials:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('customer@vendorverse.com'); setPassword('Customer@123456'); }}
                className="border border-neutral-200 p-2 rounded text-[10px] font-semibold hover:border-black text-center"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => { setEmail('seller@vendorverse.com'); setPassword('Seller@123456'); }}
                className="border border-neutral-200 p-2 rounded text-[10px] font-semibold hover:border-black text-center"
              >
                Seller
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@vendorverse.com'); setPassword('Admin@123456'); }}
                className="border border-neutral-200 p-2 rounded text-[10px] font-semibold hover:border-black text-center"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="font-bold text-black hover:underline uppercase tracking-wide">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

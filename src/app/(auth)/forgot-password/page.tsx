'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      setSent(true);
      toast.success('Password reset instructions sent if email exists.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white text-black p-4 relative font-sans">
      <div className="noise-overlay" />

      <div className="mx-auto w-full max-w-md">
        {/* Back Link */}
        <Link href="/login" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-black uppercase tracking-wider font-bold mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-extrabold text-3xl tracking-tighter inline-flex items-center gap-1.5 mb-6">
            <span>VENDORVERSE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
          </Link>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">Reset Password</h2>
          <p className="text-xs text-neutral-500 mt-2 font-light">We will send you a secure link to reset your password</p>
        </div>

        {/* Card wrapper */}
        <div className="border border-neutral-200 p-6 sm:p-8 rounded-2xl shadow-sm bg-neutral-50/50">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed font-light">
                Please check <span className="font-semibold text-black">{email}</span> for a password reset email.
              </p>
              <button 
                onClick={() => setSent(false)} 
                className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-black"
              >
                Didn't receive email? Try again.
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full border-brutal bg-black text-white py-3.5 rounded-lg font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

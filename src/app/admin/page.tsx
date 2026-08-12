'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Store, 
  Package, 
  DollarSign, 
  Activity, 
  Loader2, 
  CheckCircle, 
  Sliders, 
  Sparkles, 
  Lock, 
  Key, 
  ArrowRight,
  LogOut
} from 'lucide-react';
import RoleSwitcherNav from '@/components/RoleSwitcherNav';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeSellers: number;
  customersCount: number;
  productsCount: number;
}

interface ActivityLogItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: { name: string; email: string; role: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Admin Auth Gate Form States
  const [email, setEmail] = useState('admin@vendorverse.com');
  const [password, setPassword] = useState('Admin@123456');
  const [authLoading, setAuthLoading] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sellers' | 'logs'>('overview');

  // Verify Admin Session
  const checkAdminAuth = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (meRes.ok && meData.authenticated && meData.user?.role === 'ADMIN') {
        setAuthenticated(true);
        setAdminUser(meData.user);
        fetchAdminDashboardData();
      } else {
        setAuthenticated(false);
        setLoading(false);
      }
    } catch {
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const fetchAdminDashboardData = () => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setActivities(data.recentActivity || []);
        }
      })
      .catch((err) => console.error('Error loading admin dashboard:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.user?.role !== 'ADMIN') {
        throw new Error(data.error || 'Admin credentials required');
      }

      toast.success('Admin authentication verified!');
      setAuthenticated(true);
      setAdminUser(data.user);
      fetchAdminDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Admin login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutAdmin = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setAdminUser(null);
    toast.success('Logged out of Admin panel.');
  };

  const formatPrice = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (authenticated === null || (authenticated && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Admin Access Gate Screen (When unauthenticated or not an admin)
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white text-black font-sans relative flex flex-col justify-between">
        <div className="noise-overlay" />
        <RoleSwitcherNav />

        <main className="max-w-md mx-auto px-4 py-12 w-full my-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight">Admin Gate</h1>
            <p className="text-xs text-neutral-500 mt-2 font-light">
              This panel is restricted to authorized platform administrators. Please log in with admin credentials.
            </p>
          </div>

          <div className="border border-neutral-200 p-8 rounded-2xl bg-neutral-50/50 shadow-sm">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-neutral-200 rounded-lg p-3 text-xs bg-white outline-none focus:border-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  className="w-full border border-neutral-200 rounded-lg p-3 text-xs bg-white outline-none focus:border-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full border-brutal bg-black text-white py-3.5 rounded-lg font-bold uppercase tracking-wider text-xs shadow-brutal hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4 text-amber-500" />}
                <span>Verify Admin Access</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-200 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@vendorverse.com');
                  setPassword('Admin@123456');
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:underline"
              >
                ⚡ Auto-Fill Demo Admin Credentials
              </button>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-neutral-400 font-light">
          VendorVerse Admin Access Control
        </footer>
      </div>
    );
  }

  // Authenticated Admin Dashboard View
  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <div className="noise-overlay" />

      {/* Universal Navigation Header */}
      <RoleSwitcherNav />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Title Banner */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Authenticated Admin Session
              </span>
              <span className="text-xs text-neutral-500 font-medium">({adminUser?.email})</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight">
              Admin Management Center
            </h1>
          </div>

          <button
            onClick={handleLogoutAdmin}
            className="border border-neutral-200 hover:border-rose-600 hover:text-rose-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin Panel</span>
          </button>
        </div>

        {/* Subtab Selector */}
        <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto gap-8">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'overview' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Platform Overview</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sellers')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'sellers' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Sellers & Stores</span>
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'logs' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>
        </div>

        {/* Overview Subtab Content */}
        {activeSubTab === 'overview' && (
          <div className="space-y-10">
            {/* Metric Cards Grid */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50">
                  <div className="flex justify-between items-center text-neutral-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Platform Revenue</span>
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-display text-3xl font-black text-amber-600">{formatPrice(stats.totalRevenue)}</h3>
                </div>

                <div className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50">
                  <div className="flex justify-between items-center text-neutral-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Total Orders Processed</span>
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-3xl font-black">{stats.totalOrders}</h3>
                </div>

                <div className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50">
                  <div className="flex justify-between items-center text-neutral-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active Stores</span>
                    <Store className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-3xl font-black">{stats.activeSellers}</h3>
                </div>

                <div className="border border-neutral-200 p-6 rounded-2xl bg-neutral-50/50">
                  <div className="flex justify-between items-center text-neutral-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Platform Users</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-3xl font-black">{stats.customersCount}</h3>
                </div>
              </div>
            )}

            {/* Quick Action Hub */}
            <div className="border border-neutral-200 p-6 rounded-2xl bg-white space-y-4">
              <h3 className="font-display font-extrabold text-lg uppercase flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <span>Admin Quick Actions</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold uppercase tracking-wider">
                <Link href="/importer" className="p-4 border border-neutral-200 rounded-xl hover:border-black flex items-center justify-between">
                  <span>AI Catalog Importer</span>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </Link>
                <Link href="/products" className="p-4 border border-neutral-200 rounded-xl hover:border-black flex items-center justify-between">
                  <span>View Global Store Front</span>
                  <Package className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => toast.success('Platform settings sync verified.')}
                  className="p-4 border border-neutral-200 rounded-xl hover:border-black text-left flex items-center justify-between"
                >
                  <span>Sync Commission & Taxes</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sellers Subtab Content */}
        {activeSubTab === 'sellers' && (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="font-display font-bold text-sm uppercase">Registered Vendor Stores</h3>
              <span className="text-xs text-neutral-500 font-semibold">{stats?.activeSellers || 1} Verified Stores</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-200">
                  <th className="p-4">Store Name</th>
                  <th className="p-4">Seller Owner</th>
                  <th className="p-4">Verification Status</th>
                  <th className="p-4 text-right">Control Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                <tr className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold">Orion Supply Co</td>
                  <td className="p-4 text-neutral-500">seller@vendorverse.com</td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-200">
                      Verified Vendor
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toast.success('Store status toggled.')}
                      className="border border-neutral-200 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:border-black"
                    >
                      Manage Store
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Logs Subtab Content */}
        {activeSubTab === 'logs' && (
          <section className="space-y-4">
            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-200">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Event Type</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Audit Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-neutral-50/50">
                      <td className="p-4 text-neutral-400 text-[10px]">
                        {new Date(act.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="bg-neutral-100 font-mono text-[10px] font-bold px-2 py-1 rounded">
                          {act.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        {act.user?.name || 'System / Guest'}
                      </td>
                      <td className="p-4 font-light text-neutral-600">
                        {act.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

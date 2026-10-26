import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      login(res.token, res.user);
      if (res.user.role === 'STAFF' || res.user.role === 'ADMIN') {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">SmartBank</span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">
          Sign in to your simulated account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            register a new customer profile with welcome credit
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickDemo('customer@smartbank.local', 'CustomerPassword123!')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Sipho Dlamini</div>
                <div className="text-[10px] text-emerald-600">Customer</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('lerato@smartbank.local', 'CustomerPassword123!')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Lerato Mokoena</div>
                <div className="text-[10px] text-blue-600">Stokvel Member</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('staff@smartbank.local', 'StaffPassword123!')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Thabo Ndlovu</div>
                <div className="text-[10px] text-amber-600">Bank Staff</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@smartbank.local', 'AdminPassword123!')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Nomvula Khumalo</div>
                <div className="text-[10px] text-purple-600">Administrator</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

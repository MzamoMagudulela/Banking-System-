import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, ShieldCheck, PiggyBank, Users, TrendingUp,
  ArrowRight, CheckCircle2, Lock, FileSpreadsheet, Sparkles,
  UserCheck, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email: string) => {
    try {
      const password = email.startsWith('admin')
        ? 'AdminPassword123!'
        : email.startsWith('staff')
        ? 'StaffPassword123!'
        : 'CustomerPassword123!';
      const res = await api.login({ email, password });
      login(res.token, res.user);
      if (res.user.role === 'STAFF' || res.user.role === 'ADMIN') {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(`Demo login error: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Next-Gen Community Financial Technology
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Simulated Digital Banking for <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Cooperative Finance</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            SmartBank is an enterprise-grade prototype designed for community banks, stokvels, and microfinance organizations. Featuring an auditable double-entry ledger, savings coach, and transparent microloans.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              Enter Demonstration Platform
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Open Simulated Account
            </Link>
          </div>

          {/* Instant 1-Click Persona Logins */}
          <div className="pt-8 max-w-2xl mx-auto bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              🚀 1-Click Demonstration Personas (Zero Setup Required)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickLogin('customer@smartbank.local')}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-blue-600/80 border border-slate-600 text-xs font-medium text-white transition-all text-center"
              >
                <div className="font-semibold text-slate-100">Sipho Dlamini</div>
                <div className="text-[10px] text-emerald-400">Customer (Active)</div>
              </button>
              <button
                onClick={() => handleQuickLogin('lerato@smartbank.local')}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-blue-600/80 border border-slate-600 text-xs font-medium text-white transition-all text-center"
              >
                <div className="font-semibold text-slate-100">Lerato Mokoena</div>
                <div className="text-[10px] text-blue-300">Stokvel Member</div>
              </button>
              <button
                onClick={() => handleQuickLogin('staff@smartbank.local')}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-blue-600/80 border border-slate-600 text-xs font-medium text-white transition-all text-center"
              >
                <div className="font-semibold text-slate-100">Thabo Ndlovu</div>
                <div className="text-[10px] text-amber-300">Bank Staff</div>
              </button>
              <button
                onClick={() => handleQuickLogin('admin@smartbank.local')}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-blue-600/80 border border-slate-600 text-xs font-medium text-white transition-all text-center"
              >
                <div className="font-semibold text-slate-100">Nomvula Khumalo</div>
                <div className="text-[10px] text-purple-300">Administrator</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Engineered for Transparency, Financial Inclusion & Rigor
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Everything a cooperative institution needs to manage member deposits, encourage disciplined savings, and safely disburse community capital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Auditable Double-Entry Ledger</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Financial invariants enforced at the database level. Every transfer debits the source and credits the destination with balanced ledger entries and atomic locks.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Atomic row-level locking</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Idempotent API requests</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Reversal transaction tracking</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <PiggyBank className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Smart Savings Coach</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Empower members to build personal financial resilience with explainable pacing, progress visualizers, and weekly or monthly contribution targets.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Target date milestones</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero double-counting fund transfers</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Automated goal achievement notifications</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Community Savings Circles (Stokvels)</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Digitalized collective savings groups. Track regular member dues, rotating payout rounds, consensus approvals, and maintain a 100% transparent activity log.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Leader & treasurer approval roles</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Automated rotating payout disbursements</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Multi-member contribution tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security & Prototype Disclaimer Banner */}
      <section className="bg-white border-y border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-slate-900 text-base">Educational Engineering Prototype</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              SmartBank is built strictly as a full-stack portfolio demonstration for technical reviewers, internship recruiters, and software engineering examiners. All currency figures are simulated in South African Rand (ZAR, R) using fictional demo accounts.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors"
            >
              Explore Demo Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

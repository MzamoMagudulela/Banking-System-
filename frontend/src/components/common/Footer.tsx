import React from 'react';
import { Building2, Shield, HeartHandshake, Code, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">SmartBank</span>
              <span className="text-[10px] text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/50">
                Portfolio Engineering Prototype
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              A high-integrity digital banking management platform purpose-built for community cooperative banks, credit unions, and microfinance institutions.
            </p>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-amber-400 block mb-0.5">⚠️ Educational & Portfolio Disclaimer:</strong>
              SmartBank is an interactive software demonstration. It operates exclusively with fictional accounts and simulated ZAR money. It is not an authorized or licensed bank under the South African Reserve Bank (SARB) and does not hold actual legal deposits or connect to live payment rails.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3">Platform Modules</h4>
            <ul className="space-y-2">
              <li><Link to="/accounts" className="hover:text-blue-400 transition-colors">Multi-Account Management</Link></li>
              <li><Link to="/savings" className="hover:text-blue-400 transition-colors">Smart Savings Coach</Link></li>
              <li><Link to="/circles" className="hover:text-blue-400 transition-colors">Community Stokvel Circles</Link></li>
              <li><Link to="/loans" className="hover:text-blue-400 transition-colors">Transparent Microloans</Link></li>
              <li><Link to="/staff" className="hover:text-blue-400 transition-colors">Staff Operational Console</Link></li>
            </ul>
          </div>

          {/* Architecture & Security */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3">Security & Compliance</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> Double-Entry Ledger</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-400" /> Role-Based Access Control</li>
              <li className="flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5 text-blue-400" /> Explainable Fraud Watch</li>
              <li className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5 text-blue-400" /> Idempotent Transaction Engine</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} SmartBank Demonstration Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Default Currency: <strong>South African Rand (ZAR, R)</strong></span>
            <span>&bull;</span>
            <span className="text-slate-400">Timezone: <strong>Africa/Johannesburg (SAST)</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

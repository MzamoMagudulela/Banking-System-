import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const PrototypeBanner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 font-medium flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <span className="flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          SIMULATION ENVIRONMENT
        </span>
        <span className="hidden sm:inline">
          SmartBank is a demonstration platform for community financial institutions. Uses fictional customers and simulated ZAR currency. Not a licensed bank.
        </span>
        <span className="sm:hidden">
          Demonstration platform. Simulated funds only.
        </span>
        <div className="ml-auto hidden md:flex items-center gap-1.5 text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Audited Double-Entry Ledger Active
        </div>
      </div>
    </div>
  );
};

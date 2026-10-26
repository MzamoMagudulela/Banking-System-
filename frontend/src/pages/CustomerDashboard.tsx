import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Send, ArrowDownRight, ArrowUpRight, Plus,
  PiggyBank, Users, ShieldAlert, CheckCircle2, ChevronRight,
  RefreshCw, FileText, AlertTriangle, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { BankAccount, Transaction, SavingsGoal, SavingsCircle } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const CustomerDashboard: React.FC = () => {
  const { user, t } = useAuth();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [circles, setCircles] = useState<SavingsCircle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDesc, setDepositDesc] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [accs, txRes, goalRes, circRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getSavingsGoals(),
        api.getSavingsCircles(),
      ]);
      const accList = Array.isArray(accs) ? accs : (accs as any)?.results || [];
      const txList = Array.isArray(txRes) ? txRes : (txRes as any)?.results || [];
      const gList = Array.isArray(goalRes) ? goalRes : (goalRes as any)?.results || [];
      const cList = Array.isArray(circRes) ? circRes : (circRes as any)?.results || [];

      setAccounts(accList);
      setTransactions(txList);
      setGoals(gList);
      setCircles(cList);
      if (accList.length > 0 && !selectedAccount) {
        setSelectedAccount(accList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeGoals = Array.isArray(goals) ? goals : [];

  const totalBalance = safeAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.available_balance || '0'),
    0
  );

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await api.deposit({
        account_id: selectedAccount.id,
        amount: parseFloat(depositAmount),
        description: depositDesc || 'Simulated Cash/Card Deposit',
      });
      setActionSuccess(`Deposit of R${parseFloat(depositAmount).toFixed(2)} completed successfully!`);
      setDepositAmount('');
      setDepositDesc('');
      setShowDepositModal(false);
      loadDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await api.withdraw({
        account_id: selectedAccount.id,
        amount: parseFloat(withdrawAmount),
        description: withdrawDesc || 'Simulated ATM Withdrawal',
      });
      setActionSuccess(`Withdrawal of R${parseFloat(withdrawAmount).toFixed(2)} completed successfully!`);
      setWithdrawAmount('');
      setWithdrawDesc('');
      setShowWithdrawModal(false);
      loadDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await api.transfer({
        source_account_id: selectedAccount.id,
        destination_account_number: transferTarget.trim().toUpperCase(),
        amount: parseFloat(transferAmount),
        description: transferDesc || 'Internal Transfer',
      });
      setActionSuccess(`Transfer of R${parseFloat(transferAmount).toFixed(2)} to ${transferTarget} successful!`);
      setTransferTarget('');
      setTransferAmount('');
      setTransferDesc('');
      setShowTransferModal(false);
      loadDashboardData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportTransaction = async (txId: string) => {
    if (confirm('Report this transaction as unrecognized to the bank security team?')) {
      try {
        await api.reportTransaction(txId, 'Customer flagged this transaction as unrecognized from dashboard.');
        alert('Transaction reported. The security team will investigate.');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Notification Feedback */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t.dashboard.welcome}, {user?.first_name || 'Member'}!
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            SmartBank Community Banking Portal &bull; Standard SAST Time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-sm"
            title="Refresh Balances"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/accounts"
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors shadow-sm"
          >
            Manage Accounts
          </Link>
          <button
            onClick={() => {
              setActionError(null);
              setShowTransferModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {t.dashboard.quickTransfer}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Hero Balance & Quick Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Liquidity Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Building2 className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {t.dashboard.totalBalance}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                Active & Operational
              </span>
            </div>

            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              R{totalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-base text-slate-400 font-normal ml-2">ZAR</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActionError(null);
                  setShowDepositModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ArrowDownRight className="w-4 h-4" />
                {t.dashboard.depositFunds}
              </button>
              <button
                onClick={() => {
                  setActionError(null);
                  setShowWithdrawModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                {t.dashboard.withdrawFunds}
              </button>
              <button
                onClick={() => {
                  setActionError(null);
                  setShowTransferModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                {t.nav.transfer}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Account Mini-View */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Primary Account</h3>
              <Badge variant="info">Verified</Badge>
            </div>
            {selectedAccount ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Account Number</div>
                  <div className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                    {selectedAccount.account_number}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Account Type</span>
                  <span className="font-semibold text-slate-800">{selectedAccount.account_type}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Available Balance</span>
                  <span className="font-semibold text-slate-900">R{parseFloat(selectedAccount.available_balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-slate-500">Ledger Balance</span>
                  <span className="font-medium text-slate-600">R{parseFloat(selectedAccount.ledger_balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No accounts found.</div>
            )}
          </div>
          <Link
            to="/accounts"
            className="mt-4 w-full py-2 text-center text-xs font-semibold text-blue-600 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg transition-colors border border-blue-200/60"
          >
            View All Accounts & Statements &rarr;
          </Link>
        </div>
      </div>

      {/* Main Grid: Transactions & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {t.dashboard.recentActivity}
            </h2>
            <Link to="/accounts" className="text-xs font-semibold text-blue-600 hover:underline">
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {safeTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {t.dashboard.noTransactions}
              </div>
            ) : (
              safeTransactions.slice(0, 6).map((tx) => {
                const isIncoming = tx.destination_account_number && safeAccounts.some(a => a.account_number === tx.destination_account_number);
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isIncoming ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isIncoming ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{tx.description || tx.transaction_type}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span>{tx.reference}</span>
                          <span>&bull;</span>
                          <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className={`text-xs font-bold ${isIncoming ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isIncoming ? '+' : '-'}R{parseFloat(tx.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {tx.status}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReportTransaction(tx.id)}
                        className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Report Unrecognized Transaction"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Smart Savings Coach & Stokvel Highlights */}
        <div className="space-y-6">
          {/* Smart Savings Coach Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">{t.dashboard.savingsGoals}</h3>
              </div>
              <Link to="/savings" className="text-xs font-semibold text-blue-600 hover:underline">
                Coach &rarr;
              </Link>
            </div>

            {safeGoals.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No active savings goals. Start one to build your resilience fund!
              </div>
            ) : (
              safeGoals.slice(0, 2).map((goal) => (
                <div key={goal.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{goal.name}</span>
                    <span className="text-emerald-700">{goal.progress_percentage}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Saved: R{parseFloat(goal.current_amount).toFixed(2)}</span>
                    <span>Target: R{parseFloat(goal.target_amount).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stokvel Community Highlight */}
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-indigo-300">
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Community Stokvels</span>
            </div>
            <h4 className="font-bold text-base text-white">Soweto Community Savings Circles</h4>
            <p className="text-indigo-200 text-xs leading-relaxed">
              Join or manage digital savings groups with verified members and automated rotating payout rounds.
            </p>
            <Link
              to="/circles"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors mt-2"
            >
              Open Savings Circles
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} title="Simulated Cash/Card Deposit">
        <form onSubmit={handleDeposit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Simulate a cash deposit at a branch or ATM. Fictional credit is instantly added to your available ledger balance.
          </p>
          {actionError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Account</label>
            <select
              value={selectedAccount?.id || ''}
              onChange={(e) => setSelectedAccount(safeAccounts.find(a => a.id === e.target.value) || null)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {safeAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} ({a.account_type}) - R{a.available_balance}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. 500.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Description</label>
            <input
              type="text"
              value={depositDesc}
              onChange={(e) => setDepositDesc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="ATM Cash Deposit"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Confirm Simulated Deposit'}
          </button>
        </form>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Simulated Cash Withdrawal">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <p className="text-xs text-slate-500">
            Simulate an ATM or branch withdrawal. Debits your available balance atomically.
          </p>
          {actionError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Account</label>
            <select
              value={selectedAccount?.id || ''}
              onChange={(e) => setSelectedAccount(safeAccounts.find(a => a.id === e.target.value) || null)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {safeAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} - Available: R{a.available_balance}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. 250.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={withdrawDesc}
              onChange={(e) => setWithdrawDesc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Branch Cash Withdrawal"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Confirm Simulated Withdrawal'}
          </button>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Internal Fund Transfer">
        <form onSubmit={handleTransfer} className="space-y-4">
          <p className="text-xs text-slate-500">
            Transfer money to another SmartBank account (e.g. Lerato's account <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SB-99887766</code>).
          </p>
          {actionError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">From Account</label>
            <select
              value={selectedAccount?.id || ''}
              onChange={(e) => setSelectedAccount(safeAccounts.find(a => a.id === e.target.value) || null)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {safeAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} ({a.account_type}) - R{a.available_balance}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Account Number</label>
            <input
              type="text"
              required
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. SB-99887766"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. 350.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Reference</label>
            <input
              type="text"
              value={transferDesc}
              onChange={(e) => setTransferDesc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Groceries / contribution share"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Send Transfer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

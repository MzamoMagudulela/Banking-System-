import React, { useState, useEffect } from 'react';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCw,
  Search, ShieldCheck, FileText, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { BankAccount, Transaction, AccountType } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Open account modal
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [newAccType, setNewAccType] = useState<string>('SAVINGS');
  const [initialDeposit, setInitialDeposit] = useState<string>('250.00');

  // Ledger inspect modal
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accList, txRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
      ]);
      const safeAccs = Array.isArray(accList) ? accList : (accList as any)?.results || [];
      const safeTxs = Array.isArray(txRes) ? txRes : (txRes as any)?.results || [];
      setAccounts(safeAccs);
      setTransactions(safeTxs);
      if (safeAccs.length > 0 && !selectedAccount) {
        setSelectedAccount(safeAccs[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.openAccount({
        account_type: newAccType,
        initial_deposit: parseFloat(initialDeposit || '0'),
      });
      setSuccess(`New ${newAccType} account ${res.account_number} opened successfully!`);
      setShowOpenModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const safeTxList = Array.isArray(transactions) ? transactions : [];
  const safeAccList = Array.isArray(accounts) ? accounts : [];

  const filteredTransactions = selectedAccount
    ? safeTxList.filter(
        t => t.source_account === selectedAccount.id || t.destination_account === selectedAccount.id
      )
    : safeTxList;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Account Management & Ledger
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            View operational accounts, ledger records, and auditable transaction movements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Open New Account
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Accounts List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {safeAccList.map((acc) => {
          const isSelected = selectedAccount?.id === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccount(acc)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-900 to-blue-950 text-white border-blue-600 shadow-md ring-2 ring-blue-600'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {acc.account_type}
                </span>
                <span className={`text-xs font-semibold ${acc.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ● {acc.status}
                </span>
              </div>

              <div className="space-y-1 mb-4">
                <div className={`text-[11px] font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                  Available Balance
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  R{parseFloat(acc.available_balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  <span className={`text-xs ml-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>ZAR</span>
                </div>
              </div>

              <div className={`pt-3 border-t text-xs flex justify-between font-mono ${
                isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
              }`}>
                <span>{acc.account_number}</span>
                <span>Ledger: R{parseFloat(acc.ledger_balance).toFixed(0)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Transactions & Double-Entry Ledger Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Account Activity & Ledger for {selectedAccount?.account_number || 'All Accounts'}
            </h2>
            <p className="text-xs text-slate-500">
              Double-entry ledger records are immutable and auditable for every posted balance change.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Showing {filteredTransactions.length} transaction entries
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Reference</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Audit Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions recorded for this account.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncoming = selectedAccount
                    ? tx.destination_account === selectedAccount.id
                    : tx.transaction_type === 'DEPOSIT';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-mono font-medium text-slate-700">{tx.reference}</td>
                      <td className="py-3 font-semibold text-slate-800">{tx.transaction_type}</td>
                      <td className="py-3 text-slate-600 max-w-xs truncate">{tx.description || 'N/A'}</td>
                      <td className="py-3 text-slate-500">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className={`py-3 font-bold ${isIncoming ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isIncoming ? '+' : '-'}R{parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'REVERSED' ? 'warning' : 'danger'}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setShowLedgerModal(true);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-[11px] transition-colors"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Account Modal */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Open New SmartBank Account">
        <form onSubmit={handleOpenAccount} className="space-y-4">
          <p className="text-xs text-slate-500">
            Choose an account type. An internal fictional account number (<code className="font-mono text-slate-700">SB-XXXXXXXX</code>) will be generated.
          </p>
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
            <select
              value={newAccType}
              onChange={(e) => setNewAccType(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="SAVINGS">Savings Account (Standard interest-bearing)</option>
              <option value="CURRENT">Current / Cheque Account (Daily transactional)</option>
              <option value="GOAL_SAVINGS">Target Goal Account (Dedicated savings)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Simulated Deposit (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. 500.00"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Generating Account...' : 'Open Account Now'}
          </button>
        </form>
      </Modal>

      {/* Ledger Inspection Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title={`Double-Entry Ledger Audit: ${selectedTx?.reference || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">TRANSACTION TYPE</span>
                <span className="font-semibold text-slate-800">{selectedTx.transaction_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL AMOUNT</span>
                <span className="font-semibold text-slate-800">R{parseFloat(selectedTx.amount).toFixed(2)} {selectedTx.currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">INITIATING USER</span>
                <span className="font-semibold text-slate-800">{selectedTx.initiator_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">POSTED TIMESTAMP</span>
                <span className="font-semibold text-slate-800">{new Date(selectedTx.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Audited Ledger Postings
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Account</th>
                      <th className="p-2.5">Entry Type</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTx.ledger_entries && selectedTx.ledger_entries.length > 0 ? (
                      selectedTx.ledger_entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="p-2.5 font-mono font-medium">{entry.account_number}</td>
                          <td className="p-2.5 font-bold">
                            <span className={entry.entry_type === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'}>
                              {entry.entry_type}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold">R{parseFloat(entry.amount).toFixed(2)}</td>
                          <td className="p-2.5 text-slate-600">R{parseFloat(entry.balance_after).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Primary movement: {selectedTx.transaction_type} of R{selectedTx.amount}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
              <ShieldCheck className="w-4 h-4 inline mr-1.5 text-blue-600" />
              This record is protected by database transaction isolation (<code className="font-mono">select_for_update</code>). All debit and credit movements balance to zero across the institution.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

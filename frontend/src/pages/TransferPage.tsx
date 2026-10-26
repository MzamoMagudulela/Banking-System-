import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { BankAccount } from '../types';
import { Card } from '../components/common/Card';

export const TransferPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    api.getAccounts().then((accs) => {
      setAccounts(accs || []);
      if (accs && accs.length > 0) {
        setSourceAccountId(accs[0].id);
      }
    });
  }, []);

  const selectedSource = accounts.find((a) => a.id === sourceAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }

    if (selectedSource && numAmount > parseFloat(selectedSource.available_balance)) {
      setError(`Insufficient funds: Available balance is R${selectedSource.available_balance}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.transfer({
        source_account_id: sourceAccountId,
        destination_account_number: destinationAccount.trim().toUpperCase(),
        amount: numAmount,
        description: description || 'Internal Transfer',
      });
      setReceipt(res);
      // Refresh accounts
      const fresh = await api.getAccounts();
      setAccounts(fresh || []);
      setAmount('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Internal Funds Transfer
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Transfer simulated money between SmartBank customer accounts instantly and securely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Transfer Form (2 cols) */}
        <div className="md:col-span-2">
          <Card className="p-6">
            {receipt ? (
              <div className="space-y-6 text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Transfer Completed Successfully!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your simulated funds have been debited and credited to the recipient atomically.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{receipt.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Transferred:</span>
                    <span className="font-bold text-slate-900">R{parseFloat(receipt.amount).toFixed(2)} ZAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">From Account:</span>
                    <span className="font-mono text-slate-700">{receipt.source_account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">To Account:</span>
                    <span className="font-mono text-slate-700">{receipt.destination_account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-emerald-700 font-bold">{receipt.status}</span>
                  </div>
                </div>

                <button
                  onClick={() => setReceipt(null)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Make Another Transfer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Account</label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_number} ({a.account_type}) — Available: R{parseFloat(a.available_balance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationAccount}
                    onChange={(e) => setDestinationAccount(e.target.value)}
                    placeholder="e.g. SB-99887766"
                    className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Tip: Enter Lerato's account <code className="text-slate-600 font-mono bg-slate-100 px-1 py-0.5 rounded">SB-99887766</code> to test transfer.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (ZAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 250.00"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Description / Reference
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Monthly grocery contribution"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Executing Transfer...' : 'Authorize Simulated Transfer'}
                </button>
              </form>
            )}
          </Card>
        </div>

        {/* Transfer Guidelines (1 col) */}
        <div className="space-y-4">
          <Card className="p-5 bg-slate-50 border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety Rules Enforced
            </h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">&bull;</span>
                Transfers to the same account are rejected.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">&bull;</span>
                Negative or zero amounts are prevented.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">&bull;</span>
                Row-level locking guarantees no race conditions.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">&bull;</span>
                Transactions over R25,000 notify the Fraud Watch system.
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h4 className="font-bold text-slate-800 text-xs mb-2">Available Demo Accounts</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-slate-50 font-mono text-[11px] flex justify-between">
                <span>SB-10293847</span>
                <span className="text-slate-500">Sipho Savings</span>
              </div>
              <div className="p-2 rounded bg-slate-50 font-mono text-[11px] flex justify-between">
                <span>SB-99887766</span>
                <span className="text-slate-500">Lerato Savings</span>
              </div>
              <div className="p-2 rounded bg-slate-50 font-mono text-[11px] flex justify-between">
                <span>SB-33445566</span>
                <span className="text-slate-500">Bongani Savings</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

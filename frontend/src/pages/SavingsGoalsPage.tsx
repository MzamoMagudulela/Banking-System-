import React, { useState, useEffect } from 'react';
import {
  PiggyBank, Plus, TrendingUp, Calendar, CheckCircle2,
  AlertCircle, Sparkles, ArrowRight, DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { SavingsGoal, BankAccount } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const SavingsGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Create Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('EMERGENCY');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Fund Form State
  const [fundAccountId, setFundAccountId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundNotes, setFundNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalRes, accRes] = await Promise.all([
        api.getSavingsGoals(),
        api.getAccounts(),
      ]);
      const safeGoals = Array.isArray(goalRes) ? goalRes : (goalRes as any)?.results || [];
      const safeAccs = Array.isArray(accRes) ? accRes : (accRes as any)?.results || [];
      setGoals(safeGoals);
      setAccounts(safeAccs);
      if (safeAccs.length > 0 && !fundAccountId) {
        setFundAccountId(safeAccs[0].id);
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

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createSavingsGoal({
        name,
        category,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate,
      });
      setSuccess(`Goal '${name}' created! Your Smart Savings Coach is active.`);
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.fundSavingsGoal(selectedGoal.id, {
        source_account_id: fundAccountId,
        amount: parseFloat(fundAmount),
        notes: fundNotes || 'Personal Goal Contribution',
      });
      setSuccess(`Successfully allocated R${parseFloat(fundAmount).toFixed(2)} to '${selectedGoal.name}'!`);
      setFundAmount('');
      setFundNotes('');
      setShowFundModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Smart Savings Coach
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Target Goals & Pacing Calculator
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Set clear targets, track milestones, and receive explainable pacing recommendations.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setError(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Start New Savings Goal
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

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <PiggyBank className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Active Savings Goals</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create an Emergency Fund, School Fees, or Equipment goal to begin monitoring your savings pace.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {g.category}
                  </span>
                  <Badge variant={g.status === 'COMPLETED' ? 'success' : 'info'}>
                    {g.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{g.name}</h3>

                {/* Amount Progress */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Saved so far</span>
                    <span className="text-slate-900 font-bold">
                      R{parseFloat(g.current_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{g.progress_percentage}% completed</span>
                    <span>Target: R{parseFloat(g.target_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Smart Coach Insights */}
                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    Pacing Recommendations
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Suggested Monthly:</span>
                    <span className="font-bold text-slate-900">R{parseFloat(g.suggested_monthly_contribution).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Suggested Weekly:</span>
                    <span className="font-semibold text-slate-800">R{parseFloat(g.suggested_weekly_contribution).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Target Date:
                    </span>
                    <span>{g.target_date} ({g.days_remaining} days left)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedGoal(g);
                    setShowFundModal(true);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Contribute Funds to Goal
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Goal Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Savings Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <p className="text-xs text-slate-500">
            Define your savings target. The Smart Savings Coach will calculate the required monthly pacing automatically.
          </p>
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. Emergency Resilience Reserve"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="EMERGENCY">Emergency Fund</option>
              <option value="EDUCATION">Education / School Fees</option>
              <option value="HOUSING">Home Improvement / Rent</option>
              <option value="BUSINESS">Small Business / Inventory</option>
              <option value="VEHICLE">Vehicle / Transport</option>
              <option value="HOLIDAY">Holiday / Festive</option>
              <option value="OTHER">Other Personal Need</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="10"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. 15000.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Creating Goal...' : 'Launch Savings Goal'}
          </button>
        </form>
      </Modal>

      {/* Fund Goal Modal */}
      <Modal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        title={`Fund Goal: ${selectedGoal?.name || ''}`}
      >
        <form onSubmit={handleFundGoal} className="space-y-4">
          <p className="text-xs text-slate-500">
            Allocate funds from your active account directly to this goal. This debits your bank account balance to prevent double-counting.
          </p>
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Funding Account</label>
            <select
              value={fundAccountId}
              onChange={(e) => setFundAccountId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} ({a.account_type}) - Available: R{a.available_balance}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder={`Suggested: R${selectedGoal?.suggested_monthly_contribution || '250.00'}`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={fundNotes}
              onChange={(e) => setFundNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. October monthly savings allocation"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Recording Contribution...' : 'Transfer to Savings Goal'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

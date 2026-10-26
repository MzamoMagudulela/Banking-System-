import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Calendar, DollarSign, Award, CheckCircle2,
  AlertCircle, ChevronRight, ShieldCheck, UserCheck, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { SavingsCircle, BankAccount } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const SavingsCirclesPage: React.FC = () => {
  const { user } = useAuth();
  const [circles, setCircles] = useState<SavingsCircle[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<SavingsCircle | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showProposePayoutModal, setShowProposePayoutModal] = useState(false);

  // Create Circle Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('1000.00');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [meetingDay, setMeetingDay] = useState('First Sunday of every month');

  // Contribute Form
  const [fundingAccountId, setFundingAccountId] = useState('');
  const [duesAmount, setDuesAmount] = useState('');
  const [duesNotes, setDuesNotes] = useState('');

  // Propose Payout Form
  const [payoutRecipientId, setPayoutRecipientId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [circList, accList] = await Promise.all([
        api.getSavingsCircles(),
        api.getAccounts(),
      ]);
      const safeCircles = Array.isArray(circList) ? circList : (circList as any)?.results || [];
      const safeAccs = Array.isArray(accList) ? accList : (accList as any)?.results || [];
      setCircles(safeCircles);
      setAccounts(safeAccs);
      if (safeCircles.length > 0 && !selectedCircle) {
        setSelectedCircle(safeCircles[0]);
      }
      if (safeAccs.length > 0 && !fundingAccountId) {
        setFundingAccountId(safeAccs[0].id);
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

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.createSavingsCircle({
        name,
        description,
        contribution_amount: parseFloat(contributionAmount),
        frequency,
        meeting_day: meetingDay,
      });
      setSuccess(`Savings Circle '${name}' created! You have been designated Circle Leader.`);
      setName('');
      setDescription('');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    try {
      await api.joinSavingsCircle(circleId);
      setSuccess('You have successfully enrolled in the savings circle!');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircle) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.contributeToCircle(selectedCircle.id, {
        account_id: fundingAccountId,
        amount: parseFloat(duesAmount || selectedCircle.contribution_amount),
        notes: duesNotes || `Round ${selectedCircle.current_round} dues`,
      });
      setSuccess(`Contribution recorded for Round ${selectedCircle.current_round}!`);
      setShowContributeModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircle) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.proposeCirclePayout(selectedCircle.id, {
        recipient_id: payoutRecipientId,
        amount: parseFloat(payoutAmount),
        notes: payoutNotes || `Round ${selectedCircle.current_round} rotational payout`,
      });
      setSuccess('Payout proposed successfully. Awaiting leader/treasurer confirmation.');
      setShowProposePayoutModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    if (!selectedCircle) return;
    try {
      await api.approveCirclePayout(selectedCircle.id, payoutId);
      setSuccess('Payout approved and disbursed into member bank account!');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isMember = selectedCircle?.members?.some((m) => m.user === user?.id);
  const userRole = selectedCircle?.members?.find((m) => m.user === user?.id)?.role;
  const isLeaderOrTreasurer = userRole === 'LEADER' || userRole === 'TREASURER' || user?.role === 'STAFF';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Community Stokvel Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Community Savings Circles (Stokvels)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Transparent collective group savings with rotating payout schedules and democratic consensus.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Form a Savings Circle
        </button>
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

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Layout: Circle Selector & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Circles List (1 col) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Active Circles ({circles.length})
          </h2>
          <div className="space-y-3">
            {circles.map((c) => {
              const isSelected = selectedCircle?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCircle(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-700 shadow-md ring-2 ring-blue-600'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm tracking-tight">{c.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Round {c.current_round}
                    </span>
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-blue-200' : 'text-slate-500'} mb-3`}>
                    Dues: R{parseFloat(c.contribution_amount).toFixed(2)} ({c.frequency.toLowerCase()})
                  </div>
                  <div className={`flex justify-between text-[11px] pt-2 border-t ${
                    isSelected ? 'border-blue-800 text-blue-300' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span>{c.members?.length || 0} Members</span>
                    <span>Saved: R{parseFloat(c.total_saved || '0').toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Circle View (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCircle ? (
            <>
              {/* Circle Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{selectedCircle.name}</h2>
                      <Badge variant="info">Round {selectedCircle.current_round}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 max-w-lg">
                      {selectedCircle.description || 'Community financial group.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMember ? (
                      <button
                        onClick={() => handleJoinCircle(selectedCircle.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                      >
                        Join This Circle
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setError(null);
                          setDuesAmount(selectedCircle.contribution_amount);
                          setShowContributeModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Pay Round Dues
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Regular Dues</span>
                    <span className="font-bold text-slate-900 text-sm">R{parseFloat(selectedCircle.contribution_amount).toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Frequency</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedCircle.frequency}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Total Group Capital</span>
                    <span className="font-bold text-emerald-600 text-sm">R{parseFloat(selectedCircle.total_saved || '0').toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Meeting Schedule</span>
                    <span className="font-medium text-slate-800 text-[11px] truncate block">{selectedCircle.meeting_day}</span>
                  </div>
                </div>
              </div>

              {/* Members Roster & Rotating Payout Proposals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Members Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Circle Members ({selectedCircle.members?.length || 0})
                    </h3>
                    {isLeaderOrTreasurer && (
                      <button
                        onClick={() => {
                          setPayoutAmount((parseFloat(selectedCircle.contribution_amount) * (selectedCircle.members?.length || 1)).toFixed(2));
                          setShowProposePayoutModal(true);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        + Propose Payout
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedCircle.members?.map((m) => (
                      <div key={m.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{m.user_name}</div>
                          <div className="text-[10px] text-slate-400">{m.user_email}</div>
                        </div>
                        <Badge variant={m.role === 'LEADER' ? 'info' : m.role === 'TREASURER' ? 'warning' : 'neutral'}>
                          {m.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotating Payouts Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Rotating Payouts & Approvals
                  </h3>

                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedCircle.payouts && selectedCircle.payouts.length > 0 ? (
                      selectedCircle.payouts.map((p) => (
                        <div key={p.id} className="py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              Round {p.round_number}: R{parseFloat(p.amount).toFixed(2)}
                            </span>
                            <Badge variant={p.status === 'DISBURSED' ? 'success' : p.status === 'PROPOSED' ? 'warning' : 'neutral'}>
                              {p.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Recipient: <span className="font-medium text-slate-800">{p.recipient_name}</span>
                          </div>
                          {p.status === 'PROPOSED' && isLeaderOrTreasurer && p.recipient !== user?.id && (
                            <button
                              onClick={() => handleApprovePayout(p.id)}
                              className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-colors"
                            >
                              Approve & Disburse Payout
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No rotating payouts proposed for this circle yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a circle from the list to view members and contribution status.
            </div>
          )}
        </div>
      </div>

      {/* Create Circle Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Form a New Savings Circle">
        <form onSubmit={handleCreateCircle} className="space-y-4">
          <p className="text-xs text-slate-500">
            Form a collaborative savings circle (stokvel). You will be enrolled as the Circle Leader.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Circle Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. Pretoria Traders Stokvel"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Purpose</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Collective monthly pool for local business stock purchases"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution Dues (ZAR)</label>
              <input
                type="number"
                step="0.01"
                min="10"
                required
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
                placeholder="1000.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution Schedule</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="FORTNIGHTLY">Fortnightly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Time / Day</label>
            <input
              type="text"
              value={meetingDay}
              onChange={(e) => setMeetingDay(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Last Sunday of the month at 14:00"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Creating Circle...' : 'Establish Savings Circle'}
          </button>
        </form>
      </Modal>

      {/* Pay Dues Modal */}
      <Modal isOpen={showContributeModal} onClose={() => setShowContributeModal(false)} title={`Pay Dues for ${selectedCircle?.name || ''}`}>
        <form onSubmit={handleContribute} className="space-y-4">
          <p className="text-xs text-slate-500">
            Contribute member dues for Round {selectedCircle?.current_round}. Funds are debited from your selected account.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Funding Account</label>
            <select
              value={fundingAccountId}
              onChange={(e) => setFundingAccountId(e.target.value)}
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
              value={duesAmount}
              onChange={(e) => setDuesAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder={selectedCircle?.contribution_amount || '1000.00'}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Notes</label>
            <input
              type="text"
              value={duesNotes}
              onChange={(e) => setDuesNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. October round dues"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Processing Payment...' : 'Confirm Dues Payment'}
          </button>
        </form>
      </Modal>

      {/* Propose Payout Modal */}
      <Modal isOpen={showProposePayoutModal} onClose={() => setShowProposePayoutModal(false)} title="Propose Rotational Payout">
        <form onSubmit={handleProposePayout} className="space-y-4">
          <p className="text-xs text-slate-500">
            Designate the member to receive the pooled group capital for Round {selectedCircle?.current_round}.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Recipient Member</label>
            <select
              required
              value={payoutRecipientId}
              onChange={(e) => setPayoutRecipientId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="">-- Choose Member --</option>
              {selectedCircle?.members?.map((m) => (
                <option key={m.user} value={m.user}>{m.user_name} ({m.user_email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Pool Amount (ZAR)</label>
            <input
              type="number"
              step="0.01"
              required
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Notes / Agreement</label>
            <input
              type="text"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. Agreed in Round 2 meeting schedule"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Payout Proposal'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

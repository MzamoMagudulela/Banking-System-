import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, ShieldAlert, FileText, CheckCircle2,
  AlertCircle, Download, RefreshCw, Clock, Check, X,
  TrendingUp, Building2, BarChart2, ShieldCheck, DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import { InstitutionalOverview, User, LoanApplication, SecurityAlert } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const StaffDashboard: React.FC = () => {
  const [overview, setOverview] = useState<InstitutionalOverview | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanApplication[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'overview' | 'customers' | 'loans' | 'security'
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'loans' | 'security'>('overview');

  // Decision Modals
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [loanDecision, setLoanDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [loanReason, setLoanReason] = useState('');
  const [showLoanModal, setShowLoanModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [kycStatus, setKycStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [kycNotes, setKycNotes] = useState('');
  const [showKycModal, setShowKycModal] = useState(false);

  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [alertStatus, setAlertStatus] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [alertNotes, setAlertNotes] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [over, custs, loans, alerts] = await Promise.all([
        api.getInstitutionalOverview(),
        api.getCustomers(),
        api.getLoanApplications('status=SUBMITTED'),
        api.getSecurityAlerts('status=TRIGGERED'),
      ]);
      setOverview(over);
      setCustomers(Array.isArray(custs) ? custs : (custs as any)?.results || []);
      setPendingLoans(Array.isArray(loans) ? loans : (loans as any)?.results || []);
      setSecurityAlerts(Array.isArray(alerts) ? alerts : (alerts as any)?.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      await api.verifyCustomer(selectedCustomer.id, {
        status: kycStatus,
        notes: kycNotes || `Staff review decision: ${kycStatus}`,
      });
      setSuccess(`Customer ${selectedCustomer.email} marked as ${kycStatus}!`);
      setShowKycModal(false);
      setKycNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setSubmitting(true);
    try {
      await api.decideLoan(selectedLoan.id, {
        status: loanDecision,
        reason: loanReason || `Loan ${loanDecision.toLowerCase()} by credit committee.`,
      });
      setSuccess(`Loan application for R${parseFloat(selectedLoan.amount_requested).toFixed(2)} has been ${loanDecision}!`);
      setShowLoanModal(false);
      setLoanReason('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setSubmitting(true);
    try {
      await api.resolveSecurityAlert(selectedAlert.id, {
        status: alertStatus,
        notes: alertNotes || `Alert reviewed and marked ${alertStatus}.`,
      });
      setSuccess(`Security alert marked as ${alertStatus}.`);
      setShowAlertModal(false);
      setAlertNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Operations & Credit Committee
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Staff Operational Console
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Institutional liquidity overview, KYC verification, loan underwriting, and security alerts queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
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

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Metric Cards Banner */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Liquidity</span>
            <div className="text-xl font-extrabold text-slate-900">
              R{parseFloat(overview.metrics.total_liquidity).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Active Member Balances</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registered Members</span>
            <div className="text-xl font-extrabold text-slate-900">
              {overview.metrics.total_customers}
            </div>
            <span className="text-[10px] text-blue-600 font-medium">
              {overview.metrics.verified_customers} Verified &bull; {overview.metrics.unverified_customers} Pending
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Loans</span>
            <div className="text-xl font-extrabold text-amber-600">
              {overview.metrics.pending_loans}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting Credit Decision</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Security Alerts</span>
            <div className="text-xl font-extrabold text-red-600">
              {overview.metrics.unresolved_security_alerts}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Fraud Watch Triggers</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Operational Analytics
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'customers'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Customer KYC Review
          {customers.filter(c => !c.is_verified).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              {customers.filter(c => !c.is_verified).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'loans'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Loan Underwriting
          {pendingLoans.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {pendingLoans.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Fraud Watch Alerts
          {securityAlerts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 text-[10px]">
              {securityAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Operational Analytics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">14-Day Completed Transaction Volume</h3>
                <p className="text-xs text-slate-500">Real-time database aggregated financial movements.</p>
              </div>
              <Badge variant="info">Live Feed</Badge>
            </div>

            <div className="h-64 w-full pt-4">
              {overview?.transaction_trends && overview.transaction_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.transaction_trends}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`R${parseFloat(val).toFixed(2)}`, 'Volume (ZAR)']}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Insufficient 14-day transaction history to render trend curve.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Customer KYC Review */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Customer Identity Verification (KYC) Queue</h3>
            <p className="text-xs text-slate-500">Review member demographic details and issue verification decisions.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 font-semibold">Name / Email</th>
                  <th className="p-3 font-semibold">Employment</th>
                  <th className="p-3 font-semibold">Income (ZAR)</th>
                  <th className="p-3 font-semibold">Address / City</th>
                  <th className="p-3 font-semibold">KYC Status</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{c.first_name} {c.last_name}</div>
                      <div className="text-[10px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="p-3 text-slate-700">{c.customer_profile?.employment_status || 'EMPLOYED'}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      R{parseFloat(c.customer_profile?.monthly_income || '0').toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {c.customer_profile?.residential_address || '42 Vilakazi St'}, {c.customer_profile?.city || 'Soweto'}
                    </td>
                    <td className="p-3">
                      <Badge variant={c.is_verified ? 'success' : 'warning'}>
                        {c.is_verified ? 'VERIFIED' : 'PENDING'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowKycModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Review KYC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Loan Underwriting */}
      {activeTab === 'loans' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Credit Committee: Loan Underwriting Queue</h3>
            <p className="text-xs text-slate-500">Examine submitted microloan applications and approve disbursement or reject.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 font-semibold">Applicant</th>
                  <th className="p-3 font-semibold">Amount Requested</th>
                  <th className="p-3 font-semibold">Term</th>
                  <th className="p-3 font-semibold">Purpose</th>
                  <th className="p-3 font-semibold">Monthly Payment</th>
                  <th className="p-3 font-semibold">Notes</th>
                  <th className="p-3 font-semibold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No pending loan applications awaiting underwriting decision.
                    </td>
                  </tr>
                ) : (
                  pendingLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{loan.applicant_name}</div>
                        <div className="text-[10px] text-slate-400">{loan.applicant_email}</div>
                      </td>
                      <td className="p-3 font-extrabold text-blue-600">
                        R{parseFloat(loan.amount_requested).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-700">{loan.term_months} Months</td>
                      <td className="p-3 font-medium text-slate-800">{loan.purpose}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        R{parseFloat(loan.calculated_monthly_payment).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{loan.applicant_notes || 'None'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowLoanModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Make Decision
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Alerts */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Fraud Watch & Account Safety Queue</h3>
            <p className="text-xs text-slate-500">Explainable deterministic rules flagged by demonstration security engine.</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {securityAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                All security alerts resolved. No suspicious triggers active.
              </div>
            ) : (
              securityAlerts.map((alert) => (
                <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{alert.rule_name}</span>
                      <Badge variant={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'warning'}>
                        {alert.severity}
                      </Badge>
                      {alert.is_customer_reported && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold">
                          Customer Reported
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{alert.description}</p>
                    <div className="text-[10px] text-slate-400">
                      Member: {alert.user_email} &bull; Date: {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowAlertModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Resolve Alert
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* KYC Review Modal */}
      <Modal isOpen={showKycModal} onClose={() => setShowKycModal(false)} title={`KYC Verification: ${selectedCustomer?.email || ''}`}>
        <form onSubmit={handleKycSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div>Customer: <strong>{selectedCustomer?.first_name} {selectedCustomer?.last_name}</strong></div>
            <div>Declared Income: <strong>R{selectedCustomer?.customer_profile?.monthly_income}</strong></div>
            <div>Address: <strong>{selectedCustomer?.customer_profile?.residential_address}, {selectedCustomer?.customer_profile?.city}</strong></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
            <select
              value={kycStatus}
              onChange={(e: any) => setKycStatus(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="VERIFIED">Approve & Mark Verified</option>
              <option value="REJECTED">Reject KYC (Requires Resubmission)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Verification Notes</label>
            <textarea
              rows={2}
              value={kycNotes}
              onChange={(e) => setKycNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. Identity and address verified via simulated municipal utility bill."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Recording Decision...' : 'Confirm KYC Decision'}
          </button>
        </form>
      </Modal>

      {/* Loan Decision Modal */}
      <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="Credit Committee Loan Decision">
        <form onSubmit={handleLoanSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900 space-y-1">
            <div>Applicant: <strong>{selectedLoan?.applicant_name}</strong></div>
            <div>Requested: <strong>R{selectedLoan?.amount_requested}</strong> ({selectedLoan?.term_months} Months)</div>
            <div>Monthly Installment: <strong>R{selectedLoan?.calculated_monthly_payment}</strong></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
            <select
              value={loanDecision}
              onChange={(e: any) => setLoanDecision(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="APPROVED">Approve & Disburse Funds Immediately</option>
              <option value="REJECTED">Reject Application</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Committee Explanation</label>
            <textarea
              rows={2}
              required
              value={loanReason}
              onChange={(e) => setLoanReason(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Explain the credit decision to be recorded in the audit trail..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Executing Decision...' : 'Record Decision & Audit Event'}
          </button>
        </form>
      </Modal>

      {/* Alert Resolution Modal */}
      <Modal isOpen={showAlertModal} onClose={() => setShowAlertModal(false)} title="Resolve Security Alert">
        <form onSubmit={handleAlertSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 space-y-1">
            <div>Rule: <strong>{selectedAlert?.rule_name}</strong> ({selectedAlert?.severity})</div>
            <div>{selectedAlert?.description}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Status</label>
            <select
              value={alertStatus}
              onChange={(e: any) => setAlertStatus(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="RESOLVED">Resolved (Legitimate Transaction Confirmed)</option>
              <option value="DISMISSED">Dismissed (False Positive)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Investigation Notes</label>
            <textarea
              rows={2}
              value={alertNotes}
              onChange={(e) => setAlertNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Notes on resolution findings..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Save Alert Resolution'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

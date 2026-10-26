import React, { useState, useEffect } from 'react';
import {
  Calculator, CheckCircle2, AlertCircle, Calendar, ArrowRight,
  ShieldCheck, FileText, DollarSign, Clock, HelpCircle, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { LoanApplication, BankAccount } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const LoanCalculatorPage: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculator Inputs
  const [amount, setAmount] = useState<number>(10000);
  const [termMonths, setTermMonths] = useState<number>(6);
  const [calcResult, setCalcResult] = useState<any | null>(null);

  // Application Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [disbursementAccountId, setDisbursementAccountId] = useState('');
  const [purpose, setPurpose] = useState('BUSINESS_STOCK');
  const [applicantNotes, setApplicantNotes] = useState('');

  // Repayment Modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState('');
  const [repayAccountId, setRepayAccountId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const calculateSchedule = async (amt: number, term: number) => {
    try {
      const res = await api.calculateLoan({
        amount: amt,
        term_months: term,
      });
      setCalcResult(res);
    } catch (err: any) {
      console.error('Failed to calculate loan:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [loanList, accList] = await Promise.all([
        api.getLoanApplications(),
        api.getAccounts(),
      ]);
      const safeLoans = Array.isArray(loanList) ? loanList : (loanList as any)?.results || [];
      const safeAccs = Array.isArray(accList) ? accList : (accList as any)?.results || [];
      setLoans(safeLoans);
      setAccounts(safeAccs);
      if (safeAccs.length > 0) {
        setDisbursementAccountId(safeAccs[0].id);
        setRepayAccountId(safeAccs[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    calculateSchedule(amount, termMonths);
  }, []);

  const handleSliderChange = (newAmt: number, newTerm: number) => {
    setAmount(newAmt);
    setTermMonths(newTerm);
    calculateSchedule(newAmt, newTerm);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.applyLoan({
        disbursement_account_id: disbursementAccountId,
        amount,
        term_months: termMonths,
        purpose,
        applicant_notes: applicantNotes,
      });
      setSuccess(`Application for R${amount.toFixed(2)} submitted successfully! Staff review in progress.`);
      setShowApplyModal(false);
      setApplicantNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.repayLoan(repayLoanId, { account_id: repayAccountId });
      setSuccess('Monthly installment paid successfully!');
      setShowRepayModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold mb-2">
          <Calculator className="w-3.5 h-3.5 text-blue-600" />
          Transparent Community Lending
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Transparent Microloan Assistant
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Clear interest formulas, fixed schedules, and no hidden surprises for community entrepreneurs.
        </p>
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

      {/* Interactive Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders & Parameters (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
            Interactive Loan Simulation
          </h2>

          {/* Amount Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Requested Capital (ZAR)</label>
              <span className="text-xl font-extrabold text-blue-600">
                R{amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={amount}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value), termMonths)}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Min: R1,000</span>
              <span>Max: R50,000</span>
            </div>
          </div>

          {/* Term Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Repayment Period</label>
              <span className="text-xl font-extrabold text-slate-900">
                {termMonths} Months
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={termMonths}
              onChange={(e) => handleSliderChange(amount, parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>1 Month</span>
              <span>12 Months</span>
              <span>24 Months</span>
            </div>
          </div>

          {/* Calculation Breakdown */}
          {calcResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Monthly Payment</span>
                <span className="font-extrabold text-base text-slate-900">
                  R{parseFloat(calcResult.monthly_payment).toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Interest Rate</span>
                <span className="font-bold text-slate-800 text-sm">2.5% / month</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Total Interest</span>
                <span className="font-bold text-slate-800 text-sm">R{parseFloat(calcResult.total_interest).toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Total Repayable</span>
                <span className="font-bold text-blue-700 text-sm">R{parseFloat(calcResult.total_repayment).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setShowApplyModal(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              Submit Loan Application for R{amount.toFixed(0)}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Repayment Schedule Preview (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Estimated Repayment Schedule
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Equal monthly installments calculated via amortisation formula:
              <br />
              <code className="text-[10px] text-slate-600 font-mono">P &times; r &times; (1+r)ⁿ / ((1+r)ⁿ − 1)</code>
            </p>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
              {calcResult?.schedule?.map((item: any) => (
                <div key={item.installment_number} className="py-2 flex justify-between items-center">
                  <span className="text-slate-600">Month #{item.installment_number}</span>
                  <span className="font-bold text-slate-900">R{parseFloat(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>Transparent Guarantee:</strong>
            <br />
            Fixed R50.00 administrative fee included. Zero early settlement penalties or compounding charges.
          </div>
        </div>
      </div>

      {/* Active & Historical Applications */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          My Loan Applications & Status Tracking ({loans.length})
        </h2>

        {loans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            You have no active or previous loan applications. Use the calculator above to apply.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {loans.map((loan) => (
              <div key={loan.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      R{parseFloat(loan.amount_requested).toFixed(2)} — {loan.purpose}
                    </span>
                    <Badge variant={
                      loan.status === 'DISBURSED' || loan.status === 'CLOSED'
                        ? 'success'
                        : loan.status === 'APPROVED'
                        ? 'info'
                        : loan.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }>
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Applied: {new Date(loan.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Term</span>
                    <span className="font-semibold text-slate-800">{loan.term_months} Months</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Monthly Installment</span>
                    <span className="font-bold text-slate-900">R{parseFloat(loan.calculated_monthly_payment).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Repayment</span>
                    <span className="font-semibold text-slate-800">R{parseFloat(loan.total_repayment_amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Disbursed Account</span>
                    <span className="font-mono text-slate-700">{loan.account_number}</span>
                  </div>
                </div>

                {loan.status === 'DISBURSED' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 text-xs">
                      Installments Paid: <strong>{loan.repayments?.filter(r => r.status === 'PAID').length || 0} / {loan.term_months}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setRepayLoanId(loan.id);
                        setShowRepayModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Pay Monthly Installment (R{parseFloat(loan.calculated_monthly_payment).toFixed(2)})
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Loan Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Submit Microloan Application">
        <form onSubmit={handleApply} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold">Summary: R{amount.toFixed(2)} over {termMonths} Months</div>
            <div>Monthly Installment: <strong>R{calcResult?.monthly_payment}</strong></div>
          </div>
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Account</label>
            <select
              value={disbursementAccountId}
              onChange={(e) => setDisbursementAccountId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} ({a.account_type}) - Available: R{a.available_balance}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="BUSINESS_STOCK">Small Business Inventory / Stock</option>
              <option value="EQUIPMENT">Tools / Machinery / Equipment</option>
              <option value="EMERGENCY">Family Emergency / Medical</option>
              <option value="EDUCATION">Tuition / School Supplies</option>
              <option value="AGRICULTURE">Farming / Agriculture Inputs</option>
              <option value="OTHER">Other Community Need</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Notes</label>
            <textarea
              rows={2}
              value={applicantNotes}
              onChange={(e) => setApplicantNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="Provide a brief explanation of how the capital will be used..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Submitting Application...' : 'Confirm & Submit to Staff'}
          </button>
        </form>
      </Modal>

      {/* Repay Modal */}
      <Modal isOpen={showRepayModal} onClose={() => setShowRepayModal(false)} title="Pay Loan Installment">
        <form onSubmit={handleRepay} className="space-y-4">
          <p className="text-xs text-slate-500">
            Pay the scheduled monthly installment. Funds will be debited from your selected account and applied to your loan balance.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Funding Account</label>
            <select
              value={repayAccountId}
              onChange={(e) => setRepayAccountId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.account_number} ({a.account_type}) - Available: R{a.available_balance}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Processing Payment...' : 'Authorize Installment Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

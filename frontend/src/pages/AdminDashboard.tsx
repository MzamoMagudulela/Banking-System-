import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Sliders, FileText, Plus, CheckCircle2,
  AlertCircle, Lock, RefreshCw, Key
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityRuleConfig } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRuleConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffFirstName, setStaffFirstName] = useState('');
  const [staffLastName, setStaffLastName] = useState('');
  const [staffPassword, setStaffPassword] = useState('StaffSecure123!');
  const [staffRole, setStaffRole] = useState<'STAFF' | 'ADMIN'>('STAFF');

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rules, logs] = await Promise.all([
        api.getSecurityRules(),
        api.getAuditLogs(),
      ]);
      setSecurityRules(rules || []);
      setAuditLogs(logs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/staff/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('smartbank_token')}`
        },
        body: JSON.stringify({
          email: staffEmail,
          first_name: staffFirstName,
          last_name: staffLastName,
          password: staffPassword,
          role: staffRole,
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create staff');
      }
      setSuccess(`Staff user ${staffEmail} created successfully.`);
      setShowAddStaffModal(false);
      setStaffEmail('');
      setStaffFirstName('');
      setStaffLastName('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold mb-2">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            Superuser Control Panel
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            System Administration & Audit
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure institutional rule parameters, manage staff access, and inspect the chronological audit trail.
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
            onClick={() => {
              setError(null);
              setShowAddStaffModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Provision Staff User
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

      {/* Security Rule Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Configurable Fraud Watch Rules & Thresholds</h2>
            <p className="text-xs text-slate-500">
              Deterministic rule limits triggering review alerts on the staff dashboard.
            </p>
          </div>
          <Badge variant="info">Active Rules</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityRules.map((rule) => (
            <div key={rule.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{rule.name}</span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                  {rule.is_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{rule.description}</p>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-mono text-[11px]">
                <span className="text-slate-500">Threshold:</span>
                <span className="font-bold text-slate-900">R{parseFloat(rule.threshold_value).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chronological Audit Log Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chronological System Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Immutable logging of user authentication, transfers, KYC status changes, and staff decisions.
            </p>
          </div>
          <Badge variant="neutral">{auditLogs.length} Events Logged</Badge>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Actor</th>
                <th className="p-3 font-semibold">Action</th>
                <th className="p-3 font-semibold">Resource</th>
                <th className="p-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {log.user_email || 'System'}
                  </td>
                  <td className="p-3 font-bold text-blue-700">
                    {log.action}
                  </td>
                  <td className="p-3 text-slate-600">
                    {log.resource_type} ({log.resource_id ? log.resource_id.substring(0, 8) : 'N/A'})
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate font-sans text-xs">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Staff Modal */}
      <Modal isOpen={showAddStaffModal} onClose={() => setShowAddStaffModal(false)} title="Provision New Staff Account">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <p className="text-xs text-slate-500">
            Create an internal staff member with operational dashboard permissions or administrative privileges.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={staffFirstName}
                onChange={(e) => setStaffFirstName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={staffLastName}
                onChange={(e) => setStaffLastName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Email</label>
            <input
              type="email"
              required
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              placeholder="e.g. officer@smartbank.local"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
            <input
              type="text"
              required
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role Permission Level</label>
            <select
              value={staffRole}
              onChange={(e: any) => setStaffRole(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            >
              <option value="STAFF">Bank Staff (KYC, Loans, Transactions Review)</option>
              <option value="ADMIN">Administrator (Full Institutional Access)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Creating Staff Member...' : 'Authorize Staff Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

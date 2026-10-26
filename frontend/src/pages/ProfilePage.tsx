import React, { useState, useEffect } from 'react';
import {
  User, Shield, Phone, Mail, MapPin, Briefcase,
  CheckCircle2, AlertCircle, Save, Globe, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, language, setLanguage } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [address, setAddress] = useState(user?.customer_profile?.residential_address || '');
  const [city, setCity] = useState(user?.customer_profile?.city || '');
  const [province, setProvince] = useState(user?.customer_profile?.province || '');
  const [employment, setEmployment] = useState(user?.customer_profile?.employment_status || 'EMPLOYED');
  const [income, setIncome] = useState(user?.customer_profile?.monthly_income || '0.00');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone_number);
      if (user.customer_profile) {
        setAddress(user.customer_profile.residential_address);
        setCity(user.customer_profile.city);
        setProvince(user.customer_profile.province);
        setEmployment(user.customer_profile.employment_status);
        setIncome(user.customer_profile.monthly_income);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        residential_address: address,
        city,
        province,
        employment_status: employment,
        monthly_income: parseFloat(income),
      });
      await refreshUser();
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Profile & Security Settings
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Manage your verified customer details, contact details, and account preferences.
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

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* KYC Status Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-blue-950 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Customer Verification (KYC)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user?.is_verified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {user?.is_verified ? 'VERIFIED' : 'PENDING VERIFICATION'}
              </span>
            </div>
            <h3 className="font-bold text-lg text-white">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-xs text-slate-400">
              {user?.is_verified
                ? 'Your simulated identity has been verified by Bank Staff. Full access to lending and stokvels granted.'
                : 'Your profile is awaiting staff approval. You may still make simulated deposits and transfers.'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] text-slate-400">Role</div>
            <div className="text-sm font-bold text-blue-400 font-mono uppercase">{user?.role}</div>
          </div>
        </div>
      </Card>

      {/* Profile Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Personal & Demographic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-lg p-2.5 outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Residential & Employment Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Province</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Category</label>
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="EMPLOYED">Employed (Salaried)</option>
                  <option value="SELF_EMPLOYED">Self-Employed / Entrepreneur</option>
                  <option value="INFORMAL">Informal Economy Trader</option>
                  <option value="STUDENT">Student</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Declared Monthly Income (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

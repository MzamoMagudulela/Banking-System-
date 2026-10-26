import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Wallet, Send, PiggyBank, Users, FileText,
  LifeBuoy, ShieldAlert, LogOut, Bell, Globe, ChevronDown, Check,
  BarChart3, UserCheck, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, language, setLanguage, t } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((res) => {
          setNotifications(res.results || []);
          setUnreadCount(res.unread_count || 0);
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link to={user ? (user.role === 'CUSTOMER' ? '/dashboard' : '/staff') : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-white">
                  SmartBank
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Community
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Cooperative Financial Platform</span>
              </div>
            </Link>

            {/* Role-based Links for Logged in Users */}
            {user && (
              <div className="hidden lg:flex items-center space-x-1">
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/dashboard') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.dashboard}
                    </Link>
                    <Link
                      to="/accounts"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/accounts') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.accounts}
                    </Link>
                    <Link
                      to="/transfer"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/transfer') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.transfer}
                    </Link>
                    <Link
                      to="/savings"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/savings') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.savings}
                    </Link>
                    <Link
                      to="/circles"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/circles') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.circles}
                    </Link>
                    <Link
                      to="/loans"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/loans') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.loans}
                    </Link>
                    <Link
                      to="/support"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/support') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {t.nav.support}
                    </Link>
                  </>
                )}

                {(user.role === 'STAFF' || user.role === 'ADMIN') && (
                  <>
                    <Link
                      to="/staff"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/staff') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Staff Dashboard
                    </Link>
                    <Link
                      to="/staff/customers"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/staff/customers') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Customers & KYC
                    </Link>
                    <Link
                      to="/staff/loans"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/staff/loans') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Loan Reviews
                    </Link>
                    <Link
                      to="/staff/security"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/staff/security') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Security Queue
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive('/admin') ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Admin Control
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  language === 'en' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('zu')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  language === 'zu' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                isiZulu
              </button>
            </div>

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-800 z-50 overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                          In-App Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 text-xs transition-colors ${
                                notif.is_read ? 'bg-white' : 'bg-blue-50/60 font-medium'
                              }`}
                            >
                              <div className="font-semibold text-slate-900 mb-0.5">{notif.title}</div>
                              <div className="text-slate-600 leading-relaxed">{notif.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {user.first_name ? user.first_name[0] : user.email[0]}
                    </div>
                    <span className="text-xs font-medium text-slate-200 hidden sm:inline">
                      {user.first_name || user.email.split('@')[0]}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                          : user.role === 'STAFF'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                          : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {user.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-800 z-50 overflow-hidden py-1">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{user.role.toLowerCase()} account</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        Profile & Security
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t.nav.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/30 transition-all"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

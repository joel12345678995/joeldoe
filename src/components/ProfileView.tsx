import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { api, formatRelativeDate } from '../lib/api';
import type { User } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

export function ProfileView({
  user,
  onUserUpdated,
  onLogout,
}: ProfileViewProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [marketLocation, setMarketLocation] = useState(user.marketLocation);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name,
        phone,
        marketLocation,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      });
      onUserUpdated(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Account profile updated successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Account Summary Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <Shield className="w-4 h-4" />
            <span>
              {user.role === 'admin'
                ? 'Authorized Security Administrator'
                : 'Verified Market Vendor Account'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <div className="text-xs text-slate-500">
            <span className="font-mono tabular-nums">{user.phone}</span>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            <span>Joined {formatRelativeDate(user.createdAt)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="min-h-[44px] px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out Securely</span>
        </button>
      </div>

      {/* Edit Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
      >
        <h3 className="text-base font-bold text-slate-900">
          Personal &amp; Stall Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="prof-name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="prof-phone"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="prof-market"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Market &amp; Stall Location
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="prof-market"
              type="text"
              value={marketLocation}
              onChange={(e) => setMarketLocation(e.target.value)}
              className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">
            Change Password (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prof-cur-pw"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="prof-cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required if changing password"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="prof-new-pw"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="prof-new-pw"
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
        >
          {saving ? 'Saving Changes...' : 'Save Account Settings'}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Install VendorGuard on Your Phone
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Add VendorGuard to your Android or iPhone home screen for instant
            one-tap launch, full-screen layout, and offline readiness.
          </p>
        </div>
        <PWAInstallButton variant="card" />
      </div>
    </div>
  );
}

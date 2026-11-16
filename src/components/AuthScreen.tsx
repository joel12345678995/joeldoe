import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { api, setStoredToken } from '../lib/api';
import type { User } from '../types';
import emblemUrl from '../assets/images/vendorguard_emblem_1794513738359.jpg';
import marketVendorUrl from '../assets/images/vendor_mobile_payment_1794513739533.jpg';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoHelp, setShowDemoHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login({ phone, password });
        setStoredToken(res.token);
        onAuthenticated(res.user);
      } else {
        const res = await api.register({
          name,
          phone,
          password,
          marketLocation,
        });
        setStoredToken(res.token);
        onAuthenticated(res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoVendor() {
    setMode('login');
    setPhone('0772104582');
    setPassword('vendor123');
    setError('');
  }

  function fillDemoAdmin() {
    setMode('login');
    setPhone('0700990100');
    setPassword('admin123');
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:grid lg:grid-cols-12">
      {/* Left Desktop Context Column */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
            {!logoFailed ? (
              <img
                src={emblemUrl}
                alt="VendorGuard logo"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <span className="text-xl font-bold tracking-tight whitespace-nowrap">
            VendorGuard
          </span>
        </div>

        <div className="space-y-6 my-auto py-8">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-balance">
            Practical financial fraud protection built for Ugandan markets.
          </h1>
          <p className="text-slate-300 text-base leading-relaxed max-w-md">
            Sign in to your personal vendor account to inspect Bank of Uganda
            banknotes, verify MTN MoMo and Airtel Money confirmations, and keep
            your own secure incident records.
          </p>

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3] max-w-md relative">
            {!photoFailed ? (
              <img
                src={marketVendorUrl}
                alt="Ugandan market vendor verifying a mobile money payment on her phone"
                referrerPolicy="no-referrer"
                onError={() => setPhotoFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm p-6">
                Safe cash and mobile payment verification at your stall
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent">
              <p className="text-xs text-slate-200 font-medium">
                Owino · Nakasero · Kikuubo · Wandegeya
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Each vendor account maintains private verification history and alerts.
        </div>
      </div>

      {/* Right Auth Form Column */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-14">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Brand Header */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center shrink-0">
              {!logoFailed ? (
                <img
                  src={emblemUrl}
                  alt="VendorGuard logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">
                VendorGuard
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Personal Vendor Account Access
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Mode Switcher */}
            <div
              role="tablist"
              aria-label="Account access mode"
              className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {mode === 'login'
                  ? 'Sign in to your account'
                  : 'Create your vendor account'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {mode === 'login'
                  ? 'Enter your phone number and password to access your records.'
                  : 'Register with your name, mobile number, and password.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Grace Nakimuli"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-market"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Market &amp; Stall Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-market"
                        type="text"
                        value={marketLocation}
                        onChange={(e) => setMarketLocation(e.target.value)}
                        placeholder="e.g. Nakasero Market — Stall C8"
                        className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-phone"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0772 104 582 or +256 772 104 582"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === 'register'
                        ? 'At least 6 characters'
                        : 'Enter your password'
                    }
                    className="w-full min-h-[46px] pl-10 pr-12 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In to My Account'
                    : 'Create Account & Continue'}
              </button>
            </form>

            {/* Collapsible Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDemoHelp((prev) => !prev)}
                className="w-full min-h-[40px] flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <span>Need demonstration test credentials?</span>
                {showDemoHelp ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showDemoHelp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  <button
                    type="button"
                    onClick={fillDemoVendor}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      Sample Vendor
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      0772104582 · vendor123
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={fillDemoAdmin}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      Administrator
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      0700990100 · admin123
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

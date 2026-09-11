import React, { useState, useRef } from 'react';
import { useGym } from '../context/GymContext';
import { Role, CenterType } from '../types';
import { evaluatePasswordStrength } from '../utils/password';
import { webApi } from '../services/api';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Dumbbell,
  X,
  Eye,
  EyeOff,
  Calendar,
  Camera,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  Loader2,
  Trash2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStandaloneView?: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isStandaloneView = false,
  initialMode = 'login',
}) => {
  const { login, register, theme, toggleTheme, language, setLanguage, t } = useGym();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [center, setCenter] = useState<CenterType>('Ranaghat');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');

  // Status & Alerts
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password / OTP Flow
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const passwordStrength = evaluatePasswordStrength(mode === 'register' ? password : newPassword);

  // Countdown timer for OTP
  React.useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setTimeout(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Please enter your registered email or phone number');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await webApi.requestForgotPasswordOtp(trimmed);
      setOtpSent(true);
      setSecondsRemaining(30);
      const testCodeNotice = res?.test_otp ? ` (Test OTP: ${res.test_otp})` : '';
      setSuccessMsg(`OTP sent to ${trimmed}!${testCodeNotice}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email or phone');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!passwordStrength.isStrong) {
      setError(`Password is too weak: ${passwordStrength.unmetLabels.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      await webApi.resetForgotPassword(identifier.trim(), otp.trim(), newPassword, confirmNewPassword);
      setSuccessMsg('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setOtp('');
        setOtpSent(false);
        setError('');
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetId = identifier.trim();
    if (!targetId || !password) {
      setError('Please provide your email/phone and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(targetId, password);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordStrength.isStrong) {
      setError(`Password requirement unmet: ${passwordStrength.unmetLabels.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: `+91 ${cleanPhone}`,
        password,
        role,
        center,
        date_of_birth: dob || undefined,
        profile_image: profileImage || undefined,
      });

      setSuccessMsg('Registration submitted successfully! Your account is pending admin approval.');
      setTimeout(() => {
        setMode('login');
        setIdentifier(email.trim());
        setPassword('');
        setConfirmPassword('');
        setError('');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Email or phone may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = isStandaloneView
    ? `w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`
    : `w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`;

  const content = (
    <div className={containerClasses}>
      {/* Top Bar: Brand, Theme & Language, Close */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/hercules-logo-removebg-preview.png"
            alt="Hercules Gym Logo"
            className="w-11 h-11 object-contain drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)]"
          />
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
                HERCULES GYM
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Ranaghat • Chakdah • Madanpur</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <div className="flex items-center bg-zinc-800/40 rounded-xl p-1 border border-zinc-700/40 text-xs">
            {(['en', 'bn', 'hi'] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] uppercase transition-all ${
                  language === l
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-zinc-300 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {!isStandaloneView && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs / Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-800/40 border border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
            setSuccessMsg('');
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'login'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {t('login')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError('');
            setSuccessMsg('');
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'register'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {t('register')}
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* ===================== MODE 1: LOGIN ===================== */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">
              {t('Email or +91 phone') || 'Email or Phone Number'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="name@email.com or 9830000000"
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                  theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-400">{t('password') || 'Password'}</label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-400"
              >
                {t('forgotPassword') || 'Forgot Password?'}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                  theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{isLoading ? 'Signing In...' : t('login')}</span>
          </button>
        </form>
      )}

      {/* ===================== MODE 2: REGISTER ===================== */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {/* Profile Photo Upload */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-800/30 border border-zinc-800">
            <div className="relative w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
              {profileImage ? (
                <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-zinc-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-bold">{t('Profile Photo') || 'Profile Photo'}</p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-zinc-700/60 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                >
                  {profileImage ? 'Change Photo' : 'Upload Photo'}
                </button>
                {profileImage && (
                  <button
                    type="button"
                    onClick={() => setProfileImage('')}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">{t('Full Name') || 'Full Name'} *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Rounak Saha"
                required
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{t('email') || 'Email Address'} *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{t('phone') || 'Phone (10 Digits)'} *</label>
              <div className="relative">
                <span className="text-xs font-bold text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98300 00000"
                  required
                  className={`w-full pl-11 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Role & Center Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{t('Role') || 'Account Role'} *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              >
                <option value="member">Gym Member</option>
                <option value="trainer">Fitness Trainer</option>
                <option value="admin">Gym Administrator</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{t('Branch / Center') || 'Gym Branch'} *</label>
              <select
                value={center}
                onChange={e => setCenter(e.target.value as CenterType)}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              >
                <option value="Ranaghat">Ranaghat Branch</option>
                <option value="Chakdah">Chakdah Branch</option>
                <option value="Madanpur">Madanpur Branch</option>
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">{t('Date of Birth') || 'Date of Birth (Optional)'}</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{t('Password') || 'Password'} *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-9 pr-9 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400">{t('Confirm Password') || 'Confirm Password'} *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-9 pr-9 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Password Strength Meter */}
          {password.length > 0 && (
            <div className="p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-400">Password Strength:</span>
                <span className={passwordStrength.isStrong ? 'text-emerald-400' : 'text-amber-400'}>
                  {passwordStrength.isStrong ? 'Strong & Secure' : 'Needs Requirements'}
                </span>
              </div>
              <div className="w-full bg-zinc-700/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.score >= 7 ? 'bg-emerald-500' : passwordStrength.score >= 4 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(passwordStrength.score / passwordStrength.total) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {passwordStrength.checks.map(check => (
                  <div key={check.key} className={`flex items-center gap-1 ${check.passed ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <span className="text-[12px]">{check.passed ? '✓' : '•'}</span>
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isLoading ? 'Registering...' : t('Create Account')}</span>
          </button>
        </form>
      )}

      {/* ===================== MODE 3: FORGOT PASSWORD / OTP RESET ===================== */}
      {mode === 'forgot' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-zinc-400">
            Enter your registered email or phone number to receive a 6-digit OTP to reset your password.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400">Registered Email / Phone</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="name@gmail.com or 9830000000"
                required
                className={`flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || secondsRemaining > 0}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 disabled:opacity-50"
              >
                {secondsRemaining > 0 ? `Resend (${secondsRemaining}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className={`w-full px-3 py-2 rounded-xl border text-center tracking-widest text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Reset Password</span>
              </button>
            </>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isStandaloneView) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      {content}
    </div>
  );
};

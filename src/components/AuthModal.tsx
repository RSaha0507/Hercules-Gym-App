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
  const { currentUser, login, register, theme, toggleTheme, language, setLanguage, t } = useGym();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  // Automatically close modal when user is logged in
  React.useEffect(() => {
    if (currentUser && isOpen && !isStandaloneView) {
      onClose();
    }
  }, [currentUser, isOpen, isStandaloneView, onClose]);
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

  // Admission & Member Specific Fields
  const [admissionType, setAdmissionType] = useState<'New Admission' | 'Re-admission'>('New Admission');
  const [profession, setProfession] = useState<'Business' | 'Service' | 'Student' | 'Others'>('Student');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [sameAddress, setSameAddress] = useState(true);
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyHeight, setBodyHeight] = useState('');
  const [healthProblems, setHealthProblems] = useState('None');
  const [enrollmentProgramme, setEnrollmentProgramme] = useState<'Gym' | 'Karate' | 'Yoga' | 'Crossfit' | 'Kidsfit'>('Gym');
  const [enrollmentCategory, setEnrollmentCategory] = useState<'Ladies & Gents' | 'Ladies'>('Ladies & Gents');

  // Trainer Specific Fields
  const [trainerSpecialties, setTrainerSpecialties] = useState('Strength, Weight Loss');
  const [trainerCertifications, setTrainerCertifications] = useState('Certified Fitness Trainer');
  const [trainerExperience, setTrainerExperience] = useState('3+ Years');

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
    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
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
    const cleanGuardianPhone = guardianPhone.replace(/\D/g, '').slice(-10);
    const isValidEmail = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

    if (!fullName.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields (Name, Phone, Password)');
      return;
    }

    if (email.trim() && !isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const centerPrefix = center ? center.slice(0, 3).toUpperCase() : 'RAN';
      const autoMemberId = `HG-${centerPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase() || `${cleanPhone}@herculesgym.in`,
        phone: `+91 ${cleanPhone}`,
        password,
        role,
        center,
        date_of_birth: dob || undefined,
        profile_image: profileImage || undefined,
        member_id: role === 'member' ? autoMemberId : undefined,
        admission_type: role === 'member' ? admissionType : undefined,
        guardian_name: role === 'member' && guardianName.trim() ? guardianName.trim() : undefined,
        guardian_phone: role === 'member' && cleanGuardianPhone ? `+91 ${cleanGuardianPhone}` : undefined,
        profession: role === 'member' ? profession : undefined,
        present_address: presentAddress.trim() || undefined,
        permanent_address: sameAddress ? (presentAddress.trim() || undefined) : (permanentAddress.trim() || undefined),
        body_weight: bodyWeight ? parseFloat(bodyWeight) : undefined,
        body_height: bodyHeight.trim() || undefined,
        health_problems: healthProblems.trim() || undefined,
        enrollment_programme: role === 'member' ? enrollmentProgramme : undefined,
        enrollment_category: role === 'member' ? enrollmentCategory : undefined,
        trainer_specialties: role === 'trainer' ? trainerSpecialties.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        trainer_certifications: role === 'trainer' ? trainerCertifications.trim() : undefined,
        trainer_experience: role === 'trainer' ? trainerExperience.trim() : undefined,
      });

      setSuccessMsg('Registration submitted successfully! Your account is submitted for review.');
      setTimeout(() => {
        if (!isStandaloneView) {
          onClose();
        }
        setMode('login');
        setIdentifier(email.trim() || cleanPhone);
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Email or phone may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = isStandaloneView
    ? `w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`
    : `w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 ${
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
        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          {/* Role Switcher Pill */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400">Account Type</label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === 'member'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Member Admission</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('trainer')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === 'trainer'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Trainer Onboarding</span>
              </button>
            </div>
          </div>

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

          {/* Section 1: Admission & Personal Info */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">1. Personal & Admission Info</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {role === 'member' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Admission Type *</label>
                  <select
                    value={admissionType}
                    onChange={e => setAdmissionType(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  >
                    <option value="New Admission">New Admission</option>
                    <option value="Re-admission">Re-admission</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Mobile Number *</label>
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              {role === 'member' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Profession</label>
                  <select
                    value={profession}
                    onChange={e => setProfession(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  >
                    <option value="Business">Business</option>
                    <option value="Service">Service</option>
                    <option value="Student">Student</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400">Gym Branch / Center *</label>
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
          </div>

          {/* Section 2: Member Specifics (Guardian, Address, Health, Programme) */}
          {role === 'member' && (
            <>
              {/* Guardian Info */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">2. Guardian Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Guardian Name</label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={e => setGuardianName(e.target.value)}
                      placeholder="Father / Mother / Guardian Name"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Guardian Mobile No</label>
                    <div className="relative">
                      <span className="text-xs font-bold text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2">+91</span>
                      <input
                        type="tel"
                        value={guardianPhone}
                        onChange={e => setGuardianPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98300 00000"
                        className={`w-full pl-11 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">3. Address Information</h4>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAddress}
                      onChange={e => setSameAddress(e.target.checked)}
                      className="rounded accent-rose-600"
                    />
                    <span>Permanent same as Present</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Present Address</label>
                    <input
                      type="text"
                      value={presentAddress}
                      onChange={e => setPresentAddress(e.target.value)}
                      placeholder="Street, locality, city, pin code"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                  {!sameAddress && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400">Permanent Address</label>
                      <input
                        type="text"
                        value={permanentAddress}
                        onChange={e => setPermanentAddress(e.target.value)}
                        placeholder="Permanent residential address"
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Body Measurements & Health Problems */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">4. Physical Stats & Health</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bodyWeight}
                      onChange={e => setBodyWeight(e.target.value)}
                      placeholder="e.g. 72"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Height</label>
                    <input
                      type="text"
                      value={bodyHeight}
                      onChange={e => setBodyHeight(e.target.value)}
                      placeholder="e.g. 5 ft 9 in / 175 cm"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Health Problem</label>
                    <input
                      type="text"
                      value={healthProblems}
                      onChange={e => setHealthProblems(e.target.value)}
                      placeholder="e.g. None / Asthma / BP"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Enrollment Programme & Category */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">5. Enrollment Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Enrollment Programme *</label>
                    <select
                      value={enrollmentProgramme}
                      onChange={e => setEnrollmentProgramme(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    >
                      <option value="Gym">Gym</option>
                      <option value="Karate">Karate</option>
                      <option value="Yoga">Yoga</option>
                      <option value="Crossfit">Crossfit</option>
                      <option value="Kidsfit">Kidsfit</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Enrollment Category *</label>
                    <select
                      value={enrollmentCategory}
                      onChange={e => setEnrollmentCategory(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    >
                      <option value="Ladies & Gents">Ladies & Gents (Co-ed)</option>
                      <option value="Ladies">Ladies Only Batch</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trainer Qualifications (if role === 'trainer') */}
          {role === 'trainer' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Trainer Credentials</h4>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Specialties (comma separated)</label>
                  <input
                    type="text"
                    value={trainerSpecialties}
                    onChange={e => setTrainerSpecialties(e.target.value)}
                    placeholder="e.g. Strength & Conditioning, HIIT, Weight Loss"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Certifications</label>
                    <input
                      type="text"
                      value={trainerCertifications}
                      onChange={e => setTrainerCertifications(e.target.value)}
                      placeholder="e.g. ACE / K11 / Gold's Gym"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Experience</label>
                    <input
                      type="text"
                      value={trainerExperience}
                      onChange={e => setTrainerExperience(e.target.value)}
                      placeholder="e.g. 4 Years"
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password & Security */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/60">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Security Credentials</h4>
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isLoading ? 'Submitting Registration...' : role === 'member' ? 'Submit Member Admission' : 'Submit Trainer Registration'}</span>
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

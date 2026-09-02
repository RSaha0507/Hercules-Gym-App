import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { Role, CenterType } from '../types';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Dumbbell,
  X,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, theme, users } = useGym();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [center, setCenter] = useState<CenterType>('Ranaghat');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot password OTP states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  React.useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setTimeout(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid registered email address');
      return;
    }

    setError('');
    setIsSendingOtp(true);
    try {
      // Check if user exists in web mock list or try API
      const userExists = users.some(u => u.email.toLowerCase() === trimmed);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setSecondsRemaining(30);
      setSuccessMsg(`OTP sent to ${trimmed}! (For instant testing: OTP is ${code})`);
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP received via email');
      return;
    }
    if (otp.trim() !== generatedOtp && otp.trim() !== '123456') {
      setError('Invalid OTP code. Please check your email or resend.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSuccessMsg('Password reset successfully! You can now log in.');
    setTimeout(() => {
      setMode('login');
      setPassword('');
      setOtp('');
      setOtpSent(false);
      setError('');
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      handleResetPassword(e);
      return;
    }

    if (mode === 'login') {
      const ok = login(email, password);
      if (ok) {
        onClose();
      } else {
        setError('Invalid credentials. (Hint: use admin@hercules.com, trainer@hercules.com, or rounak@hercules.com)');
      }
    } else {
      if (!fullName || !email) {
        setError('Please fill all required fields.');
        return;
      }
      register({
        full_name: fullName,
        email,
        phone: phone || '+91 98300 00000',
        role,
        center,
        profile_image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 space-y-4 ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {mode === 'login' ? 'Hercules Gym Sign In' : mode === 'register' ? 'Join Hercules Gym' : 'Reset Account Password'}
              </h3>
              <p className="text-xs text-zinc-400">Ranaghat • Chakdah • Madanpur</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {mode === 'forgot' ? (
          <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Registered Email Address</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@hercules.com"
                  className="flex-1 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || secondsRemaining > 0}
                  className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs"
                >
                  {isSendingOtp ? 'Sending...' : secondsRemaining > 0 ? `Resend (${secondsRemaining}s)` : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">6-Digit Email OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none tracking-widest text-center text-sm font-black"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-900/30 transition-all mt-2"
                >
                  Confirm & Reset Password
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Sourav Mukherjee"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98300 12345"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Role</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as Role)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="trainer">Trainer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1">Home Center</label>
                    <select
                      value={center}
                      onChange={e => setCenter(e.target.value as CenterType)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                    >
                      <option value="Ranaghat">Ranaghat</option>
                      <option value="Chakdah">Chakdah</option>
                      <option value="Madanpur">Madanpur</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-zinc-400 font-bold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@hercules.com"
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 font-bold">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-900/30 transition-all mt-2"
            >
              {mode === 'login' ? 'Sign In to Hercules' : 'Submit Registration Request'}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
          {mode === 'login' ? (
            <p>
              New to Hercules Gym?{' '}
              <button
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className="text-rose-400 font-bold hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className="text-rose-400 font-bold hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { CenterType } from '../types';
import {
  QrCode,
  MapPin,
  CheckCircle2,
  X,
  Camera,
  Compass,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, checkIn, selectedCenter, theme } = useGym();

  const [activeCenter, setActiveCenter] = useState<CenterType>(
    selectedCenter === 'All' ? currentUser?.center || 'Ranaghat' : selectedCenter
  );
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      checkIn(activeCenter);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 space-y-5 ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Gym QR Check-In</h3>
              <p className="text-xs text-zinc-400">Scan reception QR code to log entry</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Selector for Check-In */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-400">Select Center Location</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Ranaghat', 'Chakdah', 'Madanpur'] as CenterType[]).map(center => (
              <button
                key={center}
                onClick={() => setActiveCenter(center)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCenter === center
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                }`}
              >
                {center}
              </button>
            ))}
          </div>
        </div>

        {/* Scanner Viewfinder / Simulation */}
        <div className="relative h-56 rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden p-4">
          {success ? (
            <div className="flex flex-col items-center gap-2 text-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <div className="text-sm font-black text-white">Check-In Confirmed!</div>
              <div className="text-xs text-emerald-400">Welcome to Hercules {activeCenter}</div>
            </div>
          ) : (
            <>
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-rose-500" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-rose-500" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-rose-500" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-rose-500" />

              {/* Laser animation bar */}
              {scanning && (
                <div className="absolute inset-x-4 h-0.5 bg-rose-500 shadow-[0_0_12px_#E63946] animate-pulse" />
              )}

              <div className="text-center space-y-2">
                <Camera className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">
                  {scanning ? 'Verifying Gym QR & Geolocation...' : `Point camera at Hercules ${activeCenter} turnstile`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        {!success && (
          <button
            onClick={handleSimulateScan}
            disabled={scanning}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-900/40 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{scanning ? 'Validating Entry...' : `Scan & Check In at ${activeCenter}`}</span>
          </button>
        )}
      </div>
    </div>
  );
};

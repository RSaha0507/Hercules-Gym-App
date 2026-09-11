import React from 'react';

export type Tab3DType =
  | 'dashboard'
  | 'workouts'
  | 'diet'
  | 'shop'
  | 'attendance'
  | 'hg-ai'
  | 'revenues'
  | 'members'
  | 'approvals'
  | 'messages'
  | 'profile';

interface Tab3DIconProps {
  type: Tab3DType;
  isActive: boolean;
  isHovered?: boolean;
  className?: string;
}

export const Tab3DIcon: React.FC<Tab3DIconProps> = ({
  type,
  isActive,
  isHovered = false,
  className = 'w-12 h-12',
}) => {
  const activeOrHover = isActive || isHovered;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center transition-all duration-300 ${className} ${
        activeOrHover ? 'scale-110' : 'scale-100'
      }`}
    >
      {/* Dynamic 3D Radial Glow Halo */}
      <div
        className={`absolute inset-0 rounded-xl blur-md transition-opacity duration-300 pointer-events-none ${
          isActive
            ? 'bg-rose-500/40 opacity-100'
            : isHovered
            ? 'bg-amber-500/30 opacity-80'
            : 'opacity-0'
        }`}
      />

      {/* 3D Render Graphics based on Type */}
      {type === 'workouts' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(244,63,94,0.4)] transition-transform duration-500 group-hover:rotate-12"
        >
          <defs>
            <linearGradient id="barGold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" />
              <stop offset="0.5" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="plateRose" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="plateTitanium" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#52525b" />
              <stop offset="1" stopColor="#18181b" />
            </linearGradient>
          </defs>
          {/* Olympic Knurled Bar */}
          <rect x="6" y="22" width="36" height="4" rx="2" fill="url(#barGold)" />
          {/* Left Plates */}
          <rect x="10" y="10" width="4" height="28" rx="2" fill="url(#plateRose)" />
          <rect x="14" y="14" width="3" height="20" rx="1.5" fill="url(#plateTitanium)" />
          {/* Right Plates */}
          <rect x="34" y="10" width="4" height="28" rx="2" fill="url(#plateRose)" />
          <rect x="31" y="14" width="3" height="20" rx="1.5" fill="url(#plateTitanium)" />
          {/* Outer Collars */}
          <rect x="8" y="20" width="2" height="8" rx="1" fill="#fbbf24" />
          <rect x="38" y="20" width="2" height="8" rx="1" fill="#fbbf24" />
        </svg>
      )}

      {type === 'diet' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)] transition-transform duration-500 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="shakerBody" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#e4e4e7" />
              <stop offset="0.5" stopColor="#71717a" />
              <stop offset="1" stopColor="#27272a" />
            </linearGradient>
            <linearGradient id="shakerCap" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="goldRing" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* Vitality Ring 3D Orbit */}
          <ellipse cx="24" cy="24" rx="18" ry="7" stroke="url(#goldRing)" strokeWidth="2" strokeDasharray="4 2" transform="rotate(-25 24 24)" />
          {/* Shaker Cup */}
          <path d="M17 17 L20 38 Q20 40 24 40 Q28 40 28 38 L31 17 Z" fill="url(#shakerBody)" stroke="#52525b" strokeWidth="1" />
          {/* Shaker Cap & Flip Top */}
          <rect x="15" y="13" width="18" height="4" rx="2" fill="url(#shakerCap)" />
          <rect x="21" y="9" width="6" height="4" rx="1.5" fill="#f59e0b" />
        </svg>
      )}

      {type === 'shop' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(244,63,94,0.4)] transition-transform duration-500 group-hover:-translate-y-1"
        >
          <defs>
            <linearGradient id="cartRose" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient id="suppTub" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Cart Basket */}
          <path d="M10 14 H14 L18 30 H34 L38 18 H16" stroke="url(#cartRose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Whey Protein Tub Inside Cart */}
          <rect x="22" y="11" width="10" height="12" rx="2" fill="url(#suppTub)" />
          <rect x="23" y="8" width="8" height="3" rx="1" fill="#18181b" />
          {/* Wheels */}
          <circle cx="20" cy="35" r="3" fill="#f59e0b" />
          <circle cx="32" cy="35" r="3" fill="#f59e0b" />
        </svg>
      )}

      {type === 'attendance' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(16,185,129,0.4)] transition-transform duration-500 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="calGreen" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#065f46" />
            </linearGradient>
            <linearGradient id="qrLaser" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="0.5" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Calendar Badge */}
          <rect x="10" y="12" width="28" height="26" rx="4" fill="#18181b" stroke="url(#calGreen)" strokeWidth="2" />
          <rect x="10" y="12" width="28" height="8" rx="2" fill="url(#calGreen)" />
          {/* QR Pattern Matrix Dots */}
          <rect x="15" y="24" width="4" height="4" fill="#fbbf24" rx="1" />
          <rect x="29" y="24" width="4" height="4" fill="#10b981" rx="1" />
          <rect x="22" y="28" width="4" height="4" fill="#f43f5e" rx="1" />
          {/* Top Ring Binders */}
          <rect x="16" y="8" width="3" height="6" rx="1.5" fill="#f59e0b" />
          <rect x="29" y="8" width="3" height="6" rx="1.5" fill="#f59e0b" />
        </svg>
      )}

      {type === 'hg-ai' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] transition-transform duration-700 group-hover:rotate-45"
        >
          <defs>
            <linearGradient id="aiPrism" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="0.5" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          {/* 3D Octahedron / Neural Diamond */}
          <path d="M24 6 L38 20 L24 42 L10 20 Z" fill="url(#aiPrism)" stroke="#fef08a" strokeWidth="1.5" />
          <path d="M24 6 L24 42 M10 20 L38 20" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="24" cy="20" r="3" fill="#ffffff" />
        </svg>
      )}

      {type === 'revenues' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)] transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="cardGold" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f59e0b" />
              <stop offset="0.5" stopColor="#d97706" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="cardRose" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#e11d48" />
              <stop offset="1" stopColor="#4c0519" />
            </linearGradient>
          </defs>
          {/* Back Card */}
          <rect x="14" y="10" width="26" height="18" rx="3" fill="url(#cardRose)" stroke="#fb7185" strokeWidth="1" transform="rotate(8 27 19)" />
          {/* Front Gold Smart Card */}
          <rect x="8" y="18" width="28" height="18" rx="3" fill="url(#cardGold)" stroke="#fde047" strokeWidth="1.5" />
          {/* EMV Chip */}
          <rect x="13" y="23" width="6" height="5" rx="1" fill="#fef08a" />
          <circle cx="28" cy="27" r="3" fill="#fb7185" fillOpacity="0.8" />
          <circle cx="32" cy="27" r="3" fill="#fde047" fillOpacity="0.8" />
        </svg>
      )}

      {type === 'members' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(244,63,94,0.4)] transition-transform duration-500 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#e11d48" />
              <stop offset="0.5" stopColor="#9f1239" />
              <stop offset="1" stopColor="#18181b" />
            </linearGradient>
          </defs>
          {/* 3D Athlete Shield */}
          <path d="M24 7 L37 13 C37 26 24 39 24 41 C24 39 11 26 11 13 Z" fill="url(#shieldGrad)" stroke="#f59e0b" strokeWidth="2" />
          {/* Silhouette / Star */}
          <circle cx="24" cy="19" r="4" fill="#fbbf24" />
          <path d="M17 31 C17 26 20 25 24 25 C28 25 31 26 31 31" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}

      {type === 'approvals' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(16,185,129,0.4)] transition-transform duration-500 group-hover:rotate-6"
        >
          <defs>
            <linearGradient id="verifyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
          </defs>
          {/* Octagonal Verification Seal */}
          <polygon points="24,6 36,11 41,23 36,35 24,40 12,35 7,23 12,11" fill="url(#verifyGrad)" stroke="#6ee7b7" strokeWidth="2" />
          {/* Checkmark */}
          <path d="M17 23 L22 28 L31 18" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {type === 'messages' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(244,63,94,0.4)] transition-transform duration-500 group-hover:-translate-y-1"
        >
          <defs>
            <linearGradient id="msgRose" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#be123c" />
            </linearGradient>
          </defs>
          {/* Chat Bubble 3D Layer */}
          <path d="M10 14 C10 10 14 8 24 8 C34 8 38 10 38 14 L38 28 C38 32 34 34 24 34 L16 38 L18 34 C12 34 10 32 10 28 Z" fill="url(#msgRose)" stroke="#fda4af" strokeWidth="1.5" />
          {/* Sound Waves / Dots */}
          <circle cx="18" cy="21" r="2" fill="#ffffff" />
          <circle cx="24" cy="21" r="2" fill="#ffffff" />
          <circle cx="30" cy="21" r="2" fill="#ffffff" />
        </svg>
      )}

      {type === 'profile' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)] transition-transform duration-500 group-hover:scale-110"
        >
          <defs>
            <linearGradient id="badgeGold" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* NFC Holographic ID Card */}
          <rect x="10" y="8" width="28" height="32" rx="4" fill="#18181b" stroke="url(#badgeGold)" strokeWidth="2" />
          {/* Athlete Avatar Photo Block */}
          <rect x="15" y="13" width="18" height="12" rx="2" fill="#27272a" />
          <circle cx="24" cy="18" r="3" fill="#fbbf24" />
          <path d="M18 24 C18 22 21 21 24 21 C27 21 30 22 30 24" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          {/* Barcode / NFC Track */}
          <line x1="15" y1="29" x2="33" y2="29" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="34" x2="27" y2="34" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {type === 'dashboard' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-9 h-9 drop-shadow-[0_4px_8px_rgba(244,63,94,0.4)] transition-transform duration-700 group-hover:rotate-90"
        >
          <defs>
            <linearGradient id="coreRose" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f43f5e" />
              <stop offset="0.5" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          {/* Hexagonal Power Nexus */}
          <polygon points="24,6 38,14 38,34 24,42 10,34 10,14" fill="#18181b" stroke="url(#coreRose)" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="5" fill="url(#coreRose)" />
        </svg>
      )}
    </div>
  );
};

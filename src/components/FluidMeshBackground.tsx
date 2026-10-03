import React from 'react';
import { useGym } from '../context/GymContext';

export const FluidMeshBackground: React.FC = () => {
  const { selectedCenter, currentAtmosphere } = useGym();

  // Dynamic radiant color maps based on the selected center
  const centerColors = {
    Ranaghat: {
      primary: 'rgba(244, 63, 94, 0.40)',   // rose-500
      secondary: 'rgba(245, 158, 11, 0.35)', // amber-500
      tertiary: 'rgba(225, 29, 72, 0.30)',  // red-600
      accent: 'rgba(251, 146, 60, 0.28)',   // orange-400
    },
    Chakdah: {
      primary: 'rgba(245, 158, 11, 0.40)',  // amber-500
      secondary: 'rgba(234, 179, 8, 0.35)',  // yellow-500
      tertiary: 'rgba(217, 119, 6, 0.30)',  // amber-600
      accent: 'rgba(249, 115, 22, 0.28)',   // orange-500
    },
    Madanpur: {
      primary: 'rgba(163, 230, 53, 0.40)',  // lime-400
      secondary: 'rgba(16, 185, 129, 0.35)', // emerald-500
      tertiary: 'rgba(234, 179, 8, 0.30)',  // yellow-500
      accent: 'rgba(74, 222, 128, 0.28)',   // green-400
    },
    All: {
      primary: 'rgba(244, 63, 94, 0.35)',   // rose
      secondary: 'rgba(245, 158, 11, 0.30)', // amber
      tertiary: 'rgba(163, 230, 53, 0.25)', // lime
      accent: 'rgba(16, 185, 129, 0.25)',  // emerald
    },
  };

  const centerPalette = centerColors[selectedCenter as keyof typeof centerColors] || centerColors.All;

  // Luminous environmental atmosphere colors
  const atmosphereColorMap = {
    dawn: {
      primary: 'rgba(251, 146, 60, 0.50)',   // sunrise orange
      secondary: 'rgba(56, 189, 248, 0.45)', // sky cyan
      tertiary: 'rgba(245, 158, 11, 0.38)',  // warm amber
      accent: 'rgba(14, 165, 233, 0.35)',    // morning sky
    },
    midday: {
      primary: 'rgba(239, 68, 68, 0.55)',    // hyper crimson
      secondary: 'rgba(245, 158, 11, 0.50)', // solar gold
      tertiary: 'rgba(168, 85, 247, 0.38)',  // purple energy
      accent: 'rgba(234, 179, 8, 0.40)',     // yellow light
    },
    golden_hour: {
      primary: 'rgba(249, 115, 22, 0.55)',   // sunset copper
      secondary: 'rgba(225, 29, 72, 0.48)',  // twilight red
      tertiary: 'rgba(147, 51, 234, 0.40)',  // deep violet
      accent: 'rgba(251, 191, 36, 0.40)',    // golden amber
    },
    midnight: {
      primary: 'rgba(99, 102, 241, 0.50)',   // laser indigo
      secondary: 'rgba(168, 85, 247, 0.42)', // neon purple
      tertiary: 'rgba(244, 63, 94, 0.32)',   // ruby laser
      accent: 'rgba(56, 189, 248, 0.35)',    // cyber cyan
    },
    prismatic: {
      primary: 'rgba(217, 70, 239, 0.55)',   // neon fuchsia
      secondary: 'rgba(6, 182, 212, 0.50)',  // cyan prism
      tertiary: 'rgba(244, 63, 94, 0.45)',   // laser rose
      accent: 'rgba(16, 185, 129, 0.40)',    // emerald dispersion
    },
    auto: centerPalette,
  };

  const activeColors = (currentAtmosphere?.id && atmosphereColorMap[currentAtmosphere.id]) || centerPalette;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950 transition-colors duration-1000">
      {/* 1. Dramatic Volumetric Floodlight from Top */}
      <div
        className="absolute inset-0 transition-all duration-1000 opacity-70 mix-blend-screen"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% -10%, ${activeColors.primary} 0%, ${activeColors.secondary} 40%, transparent 75%)`,
        }}
      />

      {/* 2. Floating Chromatic Aurora Orb Top-Left */}
      <div
        className="absolute -top-[20%] -left-[15%] w-[85vw] h-[85vw] rounded-full blur-[130px] transition-all duration-1000 animate-aurora mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${activeColors.primary} 0%, ${activeColors.tertiary} 50%, transparent 70%)`,
        }}
      />

      {/* 3. Radiant Chromatic Aurora Orb Bottom-Right */}
      <div
        className="absolute -bottom-[20%] -right-[15%] w-[80vw] h-[80vw] rounded-full blur-[140px] transition-all duration-1000 animate-aurora mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${activeColors.secondary} 0%, ${activeColors.accent} 45%, transparent 75%)`,
          animationDelay: '-6s',
        }}
      />

      {/* 4. Central Morphing Ambient Glow */}
      <div
        className="absolute top-[25%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[150px] transition-all duration-1000 animate-mesh mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${activeColors.tertiary} 0%, transparent 60%)`,
          animationDelay: '-12s',
        }}
      />

      {/* 5. Diagonal Spectral Ray of Light */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-screen transition-all duration-1000"
        style={{
          background: `linear-gradient(135deg, ${activeColors.primary} 0%, transparent 35%, ${activeColors.secondary} 65%, transparent 100%)`,
        }}
      />

      {/* 6. Subtle Noise Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

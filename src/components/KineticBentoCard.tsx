import React, { useState, useRef, useCallback } from 'react';
import { useGym } from '../context/GymContext';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

export interface KineticBentoCardProps {
  children?: React.ReactNode;
  expandedContent?: React.ReactNode;
  title?: React.ReactNode;
  kicker?: React.ReactNode;
  icon?: React.ReactNode;
  metric?: string | number | React.ReactNode;
  metricLabel?: string | React.ReactNode;
  className?: string;
  colSpan?: string; // e.g. 'md:col-span-6 lg:col-span-4'
  onClick?: () => void;
  isMorphable?: boolean;
  isInitiallyExpanded?: boolean;
  gradientOverlay?: boolean;
  glowColor?: string;
  actionButton?: React.ReactNode;
}

export const KineticBentoCard: React.FC<KineticBentoCardProps> = ({
  children,
  expandedContent,
  title,
  kicker,
  icon,
  metric,
  metricLabel,
  className = '',
  colSpan = 'col-span-12 md:col-span-6',
  onClick,
  isMorphable = false,
  isInitiallyExpanded = false,
  gradientOverlay = true,
  glowColor,
  actionButton,
}) => {
  const { selectedCenter, getCenterTheme } = useGym();
  const centerTheme = getCenterTheme(selectedCenter);
  const cardRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [specular, setSpecular] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const activeGlow = glowColor || centerTheme.accentHex || '#f43f5e';

  // Smooth kinetic 3D tilt tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 7 degrees tilt for subtle, high-end kinetic motion
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    const specX = (x / rect.width) * 100;
    const specY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY });
    setSpecular({ x: specX, y: specY, opacity: 0.25 });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setSpecular((prev) => ({ ...prev, opacity: 0 }));
  };

  const toggleMorph = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={`perspective-1000 ${colSpan} transition-all duration-300`}
      style={{
        '--center-glow': activeGlow,
      } as React.CSSProperties}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px) scale3d(1.006, 1.006, 1.006)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0, 0, 1)',
        }}
        className={`kinetic-card-glow relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-zinc-900/35 hover:bg-zinc-900/50 backdrop-blur-2xl border border-white/[0.05] hover:border-white/[0.12] transition-colors duration-300 flex flex-col justify-between group ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        {/* Kinetic Specular Radial Highlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-3xl"
          style={{
            background: `radial-gradient(circle 320px at ${specular.x}% ${specular.y}%, rgba(255, 255, 255, 0.12), transparent 70%)`,
            opacity: specular.opacity,
          }}
        />

        {/* Ambient Center Rim Accent Glow */}
        {gradientOverlay && (
          <div
            className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle 280px at ${specular.x}% ${specular.y}%, ${activeGlow}22, transparent 80%)`,
            }}
          />
        )}

        {/* Top Header Row */}
        {(kicker || title || icon || isMorphable || actionButton) && (
          <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
            <div className="space-y-1 min-w-0">
              {kicker && (
                <div className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5 truncate">
                  {kicker}
                </div>
              )}
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] tracking-tight truncate">
                  {title}
                </h3>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {actionButton}
              {isMorphable && expandedContent && (
                <button
                  onClick={toggleMorph}
                  className="p-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/70 border border-white/[0.05] text-zinc-300 hover:text-white transition-all"
                  title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}
              {icon && !actionButton && !isMorphable && (
                <div className="p-2 rounded-2xl bg-zinc-800/50 text-zinc-300 group-hover:text-white group-hover:bg-zinc-800/80 transition-all">
                  {icon}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Metric Display (if supplied) */}
        {metric !== undefined && (
          <div className="relative z-10 my-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Outfit'] tracking-tight">
                {metric}
              </span>
              {metricLabel && (
                <span className="text-xs text-zinc-400 font-medium">
                  {metricLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main Card Content */}
        {children && <div className="relative z-10 w-full">{children}</div>}

        {/* Morphing Kinetic Expanded Deep-Dive Tray */}
        {isMorphable && expandedContent && isExpanded && (
          <div className="relative z-10 mt-5 pt-4 border-t border-white/[0.06] animate-kinetic-morph w-full">
            {expandedContent}
          </div>
        )}
      </div>
    </div>
  );
};

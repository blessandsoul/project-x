import { useEffect, useState } from 'react';

/**
 * HeroFloatingOrbs - Minimalist Geometric Shapes
 * Features:
 * 1. Clean geometric shapes (triangles, hexagons, squares) with rotation
 * 2. Different rotation speeds and directions for dynamic effect
 * 3. Red/Salmon/Orange color scheme with subtle glow
 */
export const HeroFloatingOrbs = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
      {/* Triangle - central area */}
      <div
        className={`absolute top-[28%] left-[48%] transition-all duration-[2000ms] ease-out ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          animation: 'rotate-slow 22s linear infinite',
        }}
      >
        <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
          <path
            d="M 75 18 L 135 130 L 15 130 Z"
            stroke="#fb923c" // bright orange
            strokeWidth="2.6"
            fill="none"
            opacity="0.75"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(251, 146, 60, 0.9))',
            }}
          />
        </svg>
      </div>

      {/* Small Triangle - precise center accent */}
      <div
        className={`absolute top-[45%] left-[50%] transition-all duration-[2000ms] ease-out delay-150 ${
          mounted ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          animation: 'rotate-slow 24s linear infinite',
        }}
      >
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
          <path
            d="M 45 12 L 78 78 L 12 78 Z"
            stroke="#fdba74" // lighter orange
            strokeWidth="2.1"
            fill="none"
            opacity="0.8"
            style={{
              filter: 'drop-shadow(0 0 14px rgba(253, 186, 116, 0.95))',
            }}
          />
        </svg>
      </div>

      {/* Hexagon - slightly lower, closer to center */}
      <div
        className={`absolute top-[46%] left-[54%] transition-all duration-[2000ms] ease-out delay-200 ${
          mounted ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          animation: 'rotate-slow-reverse 26s linear infinite',
        }}
      >
        <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
          <path
            d="M 65 15 L 115 45 L 115 95 L 65 125 L 15 95 L 15 45 Z"
            stroke="#f97316" // vivid orange
            strokeWidth="2.4"
            fill="none"
            opacity="0.8"
            style={{
              filter: 'drop-shadow(0 0 18px rgba(249, 115, 22, 0.9))',
            }}
          />
        </svg>
      </div>

      {/* Square - bottom-right, but nearer center */}
      <div
        className={`absolute top-[62%] left-[57%] transition-all duration-[2000ms] ease-out delay-400 ${
          mounted ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          animation: 'rotate-slow 20s linear infinite',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect
            x="22"
            y="22"
            width="76"
            height="76"
            stroke="#fb923c" // unify with orange theme
            strokeWidth="2.4"
            fill="none"
            opacity="0.85"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(251, 146, 60, 0.95))',
            }}
          />
        </svg>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-slow-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

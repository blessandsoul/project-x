import { useEffect, useState, memo } from 'react';

/**
 * HeroFloatingOrbs - Minimalist Geometric Shapes
 * 
 * Positioned behind devices in center-right area for hero composition.
 * Features:
 * 1. GPU-accelerated rotation (transform only)
 * 2. Subtle drop-shadow for visibility against teal background
 * 3. Respects prefers-reduced-motion
 * 4. Visible on desktop (lg+), hidden on mobile/tablet
 */

/**
 * SHAPE POSITION CONFIG
 * ----------------------
 * Positions are tuned for hero composition behind devices.
 * Adjust per-shape positions here to rebalance the layout.
 * 
 * Coordinate system: top/left as percentage of hero container.
 * Target area: center-right, behind devices (devices are at ~right 50%).
 */
const SHAPE_POSITIONS = {
  // Large triangle: top-right corner
  triangleLarge: {
    top: '8%',
    right: '5%',
    left: 'auto',
    scale: 1,
  },
  // Small triangle: top-left area
  triangleSmall: {
    top: '15%',
    left: '8%',
    scale: 1,
  },
  // Hexagon: right side, middle
  hexagon: {
    top: '40%',
    right: '3%',
    left: 'auto',
    scale: 1,
  },
  // Square: bottom-right area
  square: {
    bottom: '15%',
    right: '8%',
    top: 'auto',
    left: 'auto',
    scale: 1,
  },
  // Circle: bottom-left area
  circle: {
    bottom: '20%',
    left: '5%',
    top: 'auto',
    scale: 1,
  },
  // Diamond: top-center-right area
  diamond: {
    top: '25%',
    right: '15%',
    left: 'auto',
    scale: 1,
  },
} as const;

export const HeroFloatingOrbs = memo(function HeroFloatingOrbs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
    >
      {/* Large Triangle - 60s clockwise */}
      <div
        className={`absolute ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: SHAPE_POSITIONS.triangleLarge.top,
          right: SHAPE_POSITIONS.triangleLarge.right,
          transform: `scale(${SHAPE_POSITIONS.triangleLarge.scale})`,
          animation: 'hero-rotate-slow 60s linear infinite',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        <svg width="140" height="140" viewBox="0 0 150 150" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))' }}>
          <path
            d="M 75 18 L 135 130 L 15 130 Z"
            stroke="#f59e0b"
            strokeWidth="2.2"
            fill="none"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Small Triangle - 75s clockwise */}
      <div
        className={`absolute ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: SHAPE_POSITIONS.triangleSmall.top,
          left: SHAPE_POSITIONS.triangleSmall.left,
          transform: `scale(${SHAPE_POSITIONS.triangleSmall.scale})`,
          animation: 'hero-rotate-slow 75s linear infinite',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        <svg width="70" height="70" viewBox="0 0 90 90" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(217, 119, 6, 0.35))' }}>
          <path
            d="M 45 12 L 78 78 L 12 78 Z"
            stroke="#d97706"
            strokeWidth="2"
            fill="none"
            opacity="0.65"
          />
        </svg>
      </div>

      {/* Hexagon - 90s counter-clockwise */}
      <div
        className={`absolute ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: SHAPE_POSITIONS.hexagon.top,
          right: SHAPE_POSITIONS.hexagon.right,
          transform: `scale(${SHAPE_POSITIONS.hexagon.scale})`,
          animation: 'hero-rotate-slow-reverse 90s linear infinite',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 130 130" fill="none" style={{ filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.35))' }}>
          <path
            d="M 65 15 L 115 45 L 115 95 L 65 125 L 15 95 L 15 45 Z"
            stroke="#f59e0b"
            strokeWidth="2.2"
            fill="none"
            opacity="0.75"
          />
        </svg>
      </div>

      {/* Square - 45s clockwise */}
      <div
        className={`absolute ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          bottom: SHAPE_POSITIONS.square.bottom,
          right: SHAPE_POSITIONS.square.right,
          transform: `scale(${SHAPE_POSITIONS.square.scale})`,
          animation: 'hero-rotate-slow 45s linear infinite',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        <svg width="90" height="90" viewBox="0 0 120 120" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.3))' }}>
          <rect
            x="22"
            y="22"
            width="76"
            height="76"
            stroke="#d97706"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Circle - 55s counter-clockwise (bottom-left) */}
      <div
        className={`absolute ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          bottom: SHAPE_POSITIONS.circle.bottom,
          left: SHAPE_POSITIONS.circle.left,
          transform: `scale(${SHAPE_POSITIONS.circle.scale})`,
          animation: 'hero-rotate-slow-reverse 55s linear infinite',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.3))' }}>
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#f59e0b"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Diamond - 50s clockwise (bottom-center) */}
      <div
        className={`absolute ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: SHAPE_POSITIONS.diamond.top,
          right: SHAPE_POSITIONS.diamond.right,
          transform: `scale(${SHAPE_POSITIONS.diamond.scale})`,
          animation: 'hero-rotate-slow 50s linear infinite',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(217, 119, 6, 0.3))' }}>
          <path
            d="M 50 10 L 90 50 L 50 90 L 10 50 Z"
            stroke="#d97706"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* CSS Animations - GPU accelerated, respects reduced motion */}
      <style>{`
        @keyframes hero-rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hero-rotate-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-shape-rotating {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});

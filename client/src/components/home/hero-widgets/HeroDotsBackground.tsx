const ORBS = [
  // Large soft gradient orbs - Increased visibility
  { key: 'o1', top: '10%', left: '10%', size: 400, color: 'from-emerald-400/40 to-teal-500/20', duration: 'duration-[7000ms]' },
  { key: 'o2', top: '40%', right: '5%', size: 500, color: 'from-green-400/35 to-emerald-500/20', duration: 'duration-[9000ms]' },
  { key: 'o3', top: '60%', left: '20%', size: 350, color: 'from-teal-400/35 to-green-500/20', duration: 'duration-[8000ms]' },
];

export function HeroDotsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Premium Glow Orbs Layer */}
      {ORBS.map((orb) => (
        <div
          key={orb.key}
          className={`absolute rounded-full bg-gradient-to-br ${orb.color} blur-[80px] animate-pulse ${orb.duration}`}
          style={{
            top: orb.top,
            left: orb.left,
            right: orb.right,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
          }}
        />
      ))}
    </div>
  );
}

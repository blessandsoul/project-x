import { useTranslation } from 'react-i18next';

/**
 * VinRightVisual - Ghost preview visualization
 * 
 * A subtle, atmospheric preview of decoded VIN data.
 * NOT interactive, NOT readable at first glance.
 * Exists as "background intelligence" - the promise of what you'll get.
 * 
 * Left = action, Right = promise
 */
export const VinRightVisual = () => {
  const { t } = useTranslation();

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-center items-start select-none"
      style={{ 
        pointerEvents: 'none',
        filter: 'blur(0.4px)',
      }}
      aria-hidden="true"
    >
      {/* Atmospheric depth - soft radial glow */}
      <div 
        className="absolute -left-8 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--gradient-hero-mid) 0%, transparent 70%)',
          opacity: 0.3,
        }}
      />

      {/* Ghost content wrapper - reduced opacity on entire block */}
      <div className="relative opacity-40 pl-6 lg:pl-10">
        {/* Subtle vertical accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />

        {/* Label - barely visible */}
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-4">
          {t('vin.decoder_title', 'VIN Decoder')}
        </p>

        {/* Ghost VIN string */}
        <div className="font-mono text-base lg:text-lg tracking-[0.15em] text-white/60 mb-6">
          1HGCM82633A004352
        </div>

        {/* Decoded data preview - minimal, ghosted */}
        <div className="space-y-2.5 max-w-[200px]">
          {[
            { label: 'Make', value: 'Honda' },
            { label: 'Model', value: 'Accord' },
            { label: 'Year', value: '2003' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-[10px] text-white/40 w-10">{item.label}</span>
              <span className="text-xs text-white/50">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VinRightVisual;

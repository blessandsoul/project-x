import { HeroWizard } from './hero-widgets/HeroWizard';
import { SmartRecommendations } from './SmartRecommendations';
import { Icon } from '@iconify/react';

export function HeroSection() {
  return (
    <section className="relative bg-white border-b border-slate-100 overflow-hidden pb-20">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-slate-50 -z-10 clip-path-slant" />
      
      <div className="container mx-auto pt-16 md:pt-24 space-y-12">
        <HeroWizard />
        
        {/* Process Timeline (Visual) - Restored for clarity */}
        <div className="hidden md:flex justify-between items-center max-w-4xl mx-auto px-8 py-8 relative">
           {/* Connector Line */}
           <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-200 -z-10" />
           
           {[
             { icon: 'mdi:cart-outline', label: 'Buy' },
             { icon: 'mdi:ferry', label: 'Ship' },
             { icon: 'mdi:file-document-check-outline', label: 'Clearance' },
             { icon: 'mdi:key-variant', label: 'Drive' }
           ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 bg-white p-2">
                 <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <Icon icon={step.icon} className="h-6 w-6" />
                 </div>
                 <span className="text-sm font-bold text-slate-500">{step.label}</span>
              </div>
           ))}
        </div>

        <div className="space-y-6">
           {/* Removed "Best Offers" title for cleaner look */}
           <SmartRecommendations />
           
           <div className="text-center">
              <button className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                 Show all 37 companies →
              </button>
           </div>
        </div>
      </div>
    </section>
  );
}

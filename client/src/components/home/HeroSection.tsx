import { HeroWizard } from './hero-widgets/HeroWizard';
import { CostCalculatorWidget } from './hero-widgets/CostCalculatorWidget';

export function HeroSection() {
  return (
    <section className="border-b bg-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 pt-8 pb-12 md:pt-16 md:pb-20">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-2 items-start">
          <HeroWizard />
          <CostCalculatorWidget />
        </div>
      </div>
    </section>
  );
}

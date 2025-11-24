import { HeroWizard } from './hero-widgets/HeroWizard';
import { CostCalculatorWidget } from './hero-widgets/CostCalculatorWidget';

export function HeroSection() {
  return (
    <section className="border-b bg-white">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 pt-10 pb-16 md:pt-16 md:pb-20">
        <div className="grid gap-10 md:grid-cols-2 items-start">
          <HeroWizard />
          <CostCalculatorWidget />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">1. Узнайте итоговую стоимость</p>
            <p>
              Вставьте VIN или введите бюджет  вы сразу увидите примерный расчёт с учётом доставки,
              растаможки и комиссий.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">2. Сравните компании</p>
            <p>
              Перейдите к списку проверенных компаний и сравните их по цене, рейтингу и отзывам в одной
              таблице.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">3. Выберите и свяжитесь</p>
            <p>
              Оставьте заявку онлайн или позвоните напрямую выбранной компании, используя сохранённый
              расчёт.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

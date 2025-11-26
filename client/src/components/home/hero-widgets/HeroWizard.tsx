import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function HeroWizard() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cleanInput = input.trim();

    // Always search in live auctions by query
    navigate(`/auction-listings?q=${encodeURIComponent(cleanInput)}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <h1
          id="home-hero-heading"
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
        >
          <span className="block text-primary mb-2">{t('home.hero.title')}</span>
          {t('home.hero.subtitle')}
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          {t('home.hero.description')}
        </p>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-primary/10 border border-slate-100 relative z-10 transform transition-all hover:scale-[1.01]">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
              <Icon icon="mdi:search" className="h-6 w-6" />
            </div>
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-14 md:h-16 pl-12 text-lg md:text-xl border-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-slate-300"
              placeholder={t('home.hero.search_placeholder')} 
            />
          </div>
          <Button 
            size="lg" 
            type="submit"
            className="h-14 md:h-16 px-8 md:px-12 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            {t('home.hero.calculate_btn')}
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 text-green-700 p-1 rounded-full">
            <Icon icon="mdi:check" className="h-3 w-3" />
          </div>
          {t('home.hero.verified_companies')}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-100 text-green-700 p-1 rounded-full">
            <Icon icon="mdi:check" className="h-3 w-3" />
          </div>
          {t('home.hero.fixed_prices')}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-100 text-green-700 p-1 rounded-full">
            <Icon icon="mdi:check" className="h-3 w-3" />
          </div>
          {t('home.hero.official_contracts')}
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchCompaniesFromApi } from '@/services/companiesApi';
import { cn } from '@/lib/utils';

type HeroWizardProps = {
  className?: string;
};

export function HeroWizard({ className }: HeroWizardProps) {
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

  const [companyCount, setCompanyCount] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadCompanyCount = async () => {
      try {
        const companies = await fetchCompaniesFromApi();
        if (!isCancelled) {
          setCompanyCount(Array.isArray(companies) ? companies.length : 0);
        }
      } catch (error) {
        console.error('[HeroWizard] Failed to load company count', error);
        if (!isCancelled) {
          setCompanyCount(null);
        }
      }
    };

    void loadCompanyCount();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className={cn('w-full space-y-5', className)}>
      <div className="bg-white/5 backdrop-blur-md p-2 rounded-2xl shadow-2xl shadow-primary/20 border border-white/10 relative z-10 transform transition-all hover:scale-[1.01]">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
              <Icon icon="mdi:search" className="h-6 w-6" />
            </div>
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-12 md:h-16 pl-12 text-base md:text-xl border-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-slate-300"
              placeholder={t('home.hero.search_placeholder')} 
            />
          </div>
          <Button 
            size="lg" 
            type="submit"
            className="h-12 md:h-16 px-6 md:px-12 text-base md:text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            {t('home.hero.calculate_btn')}
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-xs md:text-sm font-medium text-white/80">
        <div className="flex items-center gap-2">
          <div className="bg-white/15 text-white p-1 rounded-full">
            <Icon icon="mdi:check" className="h-3 w-3" aria-hidden="true" />
          </div>
          {companyCount !== null
            ? t('home.hero.verified_companies', { count: companyCount })
            : t('home.hero.verified_companies', { count: 0 })}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/15 text-white p-1 rounded-full">
            <Icon icon="mdi:check" className="h-3 w-3" aria-hidden="true" />
          </div>
          {t('home.hero.fixed_prices')}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/15 text-white p-1 rounded-full">
            <Icon icon="mdi:check" className="h-3 w-3" aria-hidden="true" />
          </div>
          {t('home.hero.official_contracts')}
        </div>
      </div>
    </div>
  );
}


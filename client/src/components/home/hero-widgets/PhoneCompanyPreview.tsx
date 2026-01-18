import { useEffect, useState } from 'react';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import { CompanyMobileCard } from './CompanyMobileCard';
import type { Company } from '@/types/api';

export function PhoneCompanyPreview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await searchCompaniesFromApi({
          limit: 8,
          minRating: 4.5,
          orderBy: 'cheapest',
          orderDirection: 'asc'
        });
        setCompanies(result.companies);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Triple companies for smooth infinite scroll
  const tripleCompanies = [...companies, ...companies, ...companies];

  return (
    <div className="h-full w-full bg-slate-50 overflow-hidden relative flex flex-col">
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <div className="animate-scroll-yoyo space-y-2 px-2 py-2">
          {tripleCompanies.map((company, idx) => (
            <CompanyMobileCard key={`${company.id}-${idx}`} company={company} />
          ))}
        </div>
      </div>

      {/* Gradient fade at bottom only */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />
    </div>
  );
}

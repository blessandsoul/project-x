import { memo } from 'react';
import { CompanyRowItem } from './CompanyRowItem';
import type { Company } from '@/types/api';

interface CompanyListProps {
    companies: Company[];
}

export const CompanyList = memo<CompanyListProps>(({ companies }) => {
    return (
        <div className="grid gap-3 xl:gap-4 grid-cols-1 md:grid-cols-2 min-[1400px]:grid-cols-3">
            {companies.map((company) => (
                <CompanyRowItem key={company.id} company={company} />
            ))}
        </div>
    );
});

CompanyList.displayName = 'CompanyList';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const LIMIT_OPTIONS = [10, 20, 30, 50, 100];

interface SearchFilterHeaderProps {
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    onSearchSubmit: (e: React.FormEvent) => void;
    isVip: boolean;
    onVipToggle: (checked: boolean) => void;
    limit: number;
    onLimitChange: (limit: number) => void;
    totalCompanies: number;
    displayedCount: number;
}

export const SearchFilterHeader = memo<SearchFilterHeaderProps>(({
    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    isVip,
    onVipToggle,
    limit,
    onLimitChange,
    totalCompanies,
    displayedCount,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg mb-4 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
                {/* Search Bar - Medium Width */}
                <form onSubmit={onSearchSubmit} className="flex gap-2 max-w-sm flex-1">
                    <div className="relative flex-1">
                        <Icon
                            icon="mdi:magnify"
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                        />
                        <Input
                            type="text"
                            placeholder={t('companies.search.placeholder', 'Search companies...')}
                            value={searchInput}
                            onChange={(e) => onSearchInputChange(e.target.value)}
                            className="pl-9 h-9 text-sm border-slate-300"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 shadow-sm"
                    >
                        <Icon icon="mdi:magnify" className="h-4 w-4 mr-1.5" />
                        {t('common.search', 'Search')}
                    </Button>
                </form>

                {/* VIP Filter */}
                <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                    <Checkbox
                        id="vip-filter"
                        checked={isVip}
                        onCheckedChange={onVipToggle}
                    />
                    <Label
                        htmlFor="vip-filter"
                        className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                    >
                        <Icon icon="mdi:star" className="h-4 w-4 text-amber-500" />
                        {t('companies.filter.vip', 'VIP Only')}
                    </Label>
                </div>

                {/* Limit Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">{t('companies.filter.show', 'Show')}:</span>
                    <div className="flex gap-1">
                        {LIMIT_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => onLimitChange(option)}
                                className={cn(
                                    'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                                    limit === option
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                {totalCompanies > 0 && (
                    <p className="text-xs font-medium text-slate-600 ml-auto">
                        {t('catalog.results.showing')} <span className="font-bold text-slate-900">{displayedCount}</span> {t('catalog.results.connector')} <span className="font-bold text-slate-900">{totalCompanies}</span> {t('catalog.results.of')}
                    </p>
                )}
            </div>
        </div>
    );
});

SearchFilterHeader.displayName = 'SearchFilterHeader';

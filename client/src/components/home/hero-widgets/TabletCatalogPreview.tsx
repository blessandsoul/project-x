import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import type { Company } from '@/types/api';
import { CompanyListItem } from '@/components/catalog/CompanyListItem';

/**
 * AnimatedCountingPrice - Counts up to the target value
 */
function AnimatedCountingPrice({ value, delay = 0 }: { value: number; delay?: number }) {
    const [displayValue, setDisplayValue] = useState(value - 400);

    useEffect(() => {
        let start = value - 400;
        const duration = 2000;
        let animationFrameId: number;
        let timeoutId: number;

        // Wait for the delay before starting animation
        timeoutId = window.setTimeout(() => {
            const startTime = performance.now();

            const update = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);

                const current = start + (value - start) * ease;
                setDisplayValue(current);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(update);
                }
            };
            animationFrameId = requestAnimationFrame(update);
        }, delay * 1000); // Convert seconds to milliseconds

        return () => {
            clearTimeout(timeoutId);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [value, delay]);

    return (
        <span>
            {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(displayValue)}
        </span>
    );
}

export function TabletCatalogPreview() {
    const { t } = useTranslation();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [displayCompanies, setDisplayCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        searchCompaniesFromApi({ limit: 8, offset: 0 })
            .then((result) => {
                const fetched = result.companies || [];
                setCompanies(fetched);
                // Initial shuffle
                if (fetched.length > 0) {
                    setDisplayCompanies([...fetched].sort(() => Math.random() - 0.5));
                }
            })
            .catch((err) => {
                console.error('Failed to fetch companies:', err);
                setError(err instanceof Error ? err.message : 'Failed to load');
            })
            .finally(() => setLoading(false));
    }, []);

    // Periodic Re-shuffle (every 10s)
    useEffect(() => {
        if (loading || !companies || companies.length === 0) return;

        const intervalId = setInterval(() => {
            const shuffled = [...companies].sort(() => Math.random() - 0.5);
            setDisplayCompanies(shuffled);
            setAnimationKey(prev => prev + 1);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [companies, loading]);

    if (loading) {
        return (
            <div className="h-full w-full bg-slate-50 p-8 transform scale-[0.48] origin-top-left" style={{ width: '208%', height: '208%' }}>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
                            <Skeleton className="h-14 w-14 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full bg-slate-50 flex items-center justify-center transform scale-[0.48] origin-top-left" style={{ width: '208%', height: '208%' }}>
                <div className="text-center">
                    <Icon icon="mdi:alert-circle" className="h-10 w-10 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 font-medium">{t('common.error_loading', 'Failed to load')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 text-slate-900 overflow-hidden flex flex-col transform scale-[0.48] origin-top-left" style={{ width: '208%', height: '208%' }}>
            {/* Mock Header matching Catalog Page */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                        <Icon icon="mdi:domain" className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">{t('catalog.title', 'Trusted Importers')}</h2>
                        <p className="text-sm text-slate-500">{t('catalog.subtitle', 'Verified partners & shipping rates')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 px-4 rounded-lg bg-slate-100 flex items-center gap-2 text-slate-500">
                        <Icon icon="mdi:magnify" className="h-5 w-5" />
                        <span className="text-sm font-medium">Search companies...</span>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-700">
                        <Icon icon="mdi:filter-variant" className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1">
                {displayCompanies.map((company, index) => {
                    // Generate a deterministic "calculated" price for visual consistency 
                    const idSum = company.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    const mockPrice = 1450 + (idSum % 500);

                    // Animation timing: Total 2s
                    const totalAnimationTime = 2; // seconds
                    const animationDuration = 0.5; // seconds
                    const totalCompanies = displayCompanies.length;
                    const delayPerItem = totalCompanies > 1
                        ? (totalAnimationTime - animationDuration) / (totalCompanies - 1)
                        : 0;

                    return (
                        <motion.div
                            key={`${company.id}-${animationKey}`}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: animationDuration,
                                delay: index * delayPerItem,
                                ease: "easeOut"
                            }}
                            className="pointer-events-none select-none"
                        >
                            <CompanyListItem
                                company={company}
                                hasAuctionBranch={true}
                                calculatedShippingPrice={<AnimatedCountingPrice value={mockPrice} delay={index * delayPerItem} />}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

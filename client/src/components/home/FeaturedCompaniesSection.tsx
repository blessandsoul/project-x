import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompanyRating } from '@/components/company/CompanyRating'
import { VipBadge } from '@/components/company/VipBadge'
import { Icon } from '@iconify/react'
import { EmptyState } from '@/components/company/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Image } from '@/components/ui/image'
import type { Company } from '@/types/api'
import { cn } from '@/lib/utils'

type VipTier = 'diamond' | 'gold' | 'silver'

type FeaturedCompaniesSectionProps = {
  companies: Company[]
  isLoading: boolean
}

export function FeaturedCompaniesSection({
  companies,
  isLoading,
}: FeaturedCompaniesSectionProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const vipCompanies = useMemo<Company[]>(() => {
    if (!companies || companies.length === 0) return []
    return [...companies]
       .filter((c) => c.vipStatus)
       .sort((a, b) => b.rating - a.rating)
       .slice(0, 3)
  }, [companies])

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader className="space-y-2">
             <Skeleton className="h-6 w-1/3" />
             <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-20 w-full rounded-lg" />
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))
    }

    if (vipCompanies.length === 0) {
      return (
        <Card className="md:col-span-3 p-8 border-dashed">
          <EmptyState
            icon="mdi:star-off-outline"
            title={t('home.featured_companies.empty_title')}
            description={t('home.featured_companies.empty_desc')}
            action={null}
          />
        </Card>
      )
    }

    const tiers: VipTier[] = ['diamond', 'gold', 'silver']

    return vipCompanies.map((company, index) => {
      const tier = tiers[index] ?? 'silver'
      
      const tierStyles = {
        diamond: 'border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/20 shadow-cyan-100/50',
        gold: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 shadow-amber-100/50',
        silver: 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/20',
      }

      return (
        <Card
          key={company.id}
          className={cn(
             "group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
             tierStyles[tier]
          )}
          onClick={() => navigate(`/company/${company.id}`)}
        >
          <div className="p-6 flex flex-col h-full">
            {/* Header: Logo & Name */}
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-xl overflow-hidden border shadow-sm bg-white">
                       <Image 
                           src={company.logo ?? ''} 
                           alt={company.name} 
                           className="h-full w-full object-cover"
                           objectFit="contain"
                       />
                   </div>
                   <div>
                       <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-primary transition-colors">
                           {company.name}
                       </h3>
                       <div className="flex items-center gap-1 text-xs text-muted-foreground">
                           <Icon icon="mdi:map-marker" className="h-3 w-3" />
                           {company.location?.city || 'Tbilisi'}
                       </div>
                   </div>
               </div>
               {tier === 'diamond' && (
                   <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white p-1.5 rounded-lg shadow-lg shadow-cyan-500/30">
                       <Icon icon="mdi:diamond-stone" className="h-5 w-5" />
                   </div>
               )}
               {tier === 'gold' && <Icon icon="mdi:trophy" className="h-6 w-6 text-amber-400 drop-shadow-sm" />}
            </div>

            {/* Rating & Stats */}
            <div className="flex items-center gap-3 mb-4 bg-background/50 rounded-lg p-2 border border-border/50">
                <div className="flex items-center gap-1.5">
                   <span className="text-lg font-bold text-foreground">{company.rating}</span>
                   <CompanyRating rating={company.rating} showValue={false} className="h-4" />
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-xs text-muted-foreground">
                    {company.reviewCount} {t('common.reviews')}
                </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-auto">
                 {tier === 'diamond' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-cyan-100/50 text-cyan-700 text-[10px] font-bold uppercase tracking-wider dark:bg-cyan-900/30 dark:text-cyan-300">
                        Top Partner
                    </span>
                 )}
                 <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    Verified
                 </span>
                 {(company.services || []).slice(0, 2).map(service => (
                     <span key={service} className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-medium">
                        {service}
                     </span>
                 ))}
            </div>

            {/* Footer: Response Time */}
            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Icon icon="mdi:clock-check-outline" className="h-4 w-4" />
                    <span>Quick Response</span>
                </div>
                <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform text-primary font-medium">
                    View Profile
                    <Icon icon="mdi:arrow-right" className="h-3.5 w-3.5" />
                </div>
            </div>
          </div>
        </Card>
      )
    })
  }

  return (
    <section
      className="py-16 lg:py-24 bg-muted/30"
      id="home-featured-companies-section"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {t('home.featured_companies.title')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('home.featured_companies.description')}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/catalog')} className="group">
            {t('home.featured_companies.view_all')}
            <Icon icon="mdi:arrow-right" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderContent()}
        </div>
      </div>
    </section>
  )
}

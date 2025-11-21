import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react/dist/iconify.js'

import type { Company } from '@/types/api'

type CompanyTileProps = {
  company: Company
}

export function CompanyTile({ company }: CompanyTileProps) {
  return (
    <Link
      to={`/company/${company.id}`}
      className="group block rounded-lg border bg-card p-3 hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <img
          src={company.logo}
          alt={company.name}
          className="h-10 w-10 rounded-md object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium leading-tight line-clamp-2">
              {company.name}
            </p>
            {company.vipStatus && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                VIP
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon
                icon="mdi:star"
                className="h-3 w-3 text-yellow-400 fill-current"
              />
              <span className="tabular-nums">{company.rating.toFixed(1)}</span>
              {company.reviewCount > 0 && (
                <span className="text-[10px] text-muted-foreground/80">
                  ({company.reviewCount})
                </span>
              )}
            </span>
            <span>• {company.location.city}</span>
          </div>
        </div>
        <Icon
          icon="mdi:chevron-right"
          className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </Link>
  )
}

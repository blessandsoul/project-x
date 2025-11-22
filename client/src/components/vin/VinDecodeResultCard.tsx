import type { FC } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react/dist/iconify.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getOrderedVinEntries, formatVinFieldKey, formatVinFieldValue } from '@/lib/vinFormatting'

export interface VinDecodeResultCardProps {
  vin: string
  data: Record<string, unknown> | null | undefined
}

export const VinDecodeResultCard: FC<VinDecodeResultCardProps> = ({ vin, data }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const entries = getOrderedVinEntries(data ?? undefined)

  const canSearchCatalog = useMemo(() => {
    if (!data || typeof data !== 'object') return false
    const raw = data as Record<string, unknown>
    const make = typeof raw.make === 'string' ? raw.make : null
    const model = typeof raw.model === 'string' ? raw.model : null
    const year =
      typeof raw.model_year === 'string'
        ? raw.model_year
        : typeof raw.year === 'string' || typeof raw.year === 'number'
          ? String(raw.year)
          : null

    return Boolean(make || model || year)
  }, [data])

  const handleGoToCatalog = () => {
    if (!data || typeof data !== 'object') return
    const raw = data as Record<string, unknown>

    const make = typeof raw.make === 'string' ? raw.make : null
    const model = typeof raw.model === 'string' ? raw.model : null
    const year =
      typeof raw.model_year === 'string'
        ? raw.model_year
        : typeof raw.year === 'string' || typeof raw.year === 'number'
          ? String(raw.year)
          : null

    const parts: string[] = []
    if (make) parts.push(make)
    if (model) parts.push(model)
    if (year) parts.push(year)

    const query = parts.join(' ').trim()
    const search = query ? `?q=${encodeURIComponent(query)}` : ''

    navigate(`/catalog${search}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon icon="mdi:car-info" className="h-5 w-5 text-primary" />
          {t('vin.result_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <span className="block text-xs text-muted-foreground">{t('vin.result_vin_label')}</span>
          <span className="font-medium tracking-[0.1em] uppercase">{vin}</span>
        </div>

        <div className="space-y-2">
          <span className="block text-xs text-muted-foreground">{t('vin.result_data_label')}</span>
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('vin.result_empty_data', 'No additional data returned for this VIN.')}
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {entries.map(([key, value]) => (
                  <div
                    key={key}
                    className="space-y-0.5"
                  >
                    <dt className="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-wide">
                      {formatVinFieldKey(key)}
                    </dt>
                    <dd className="text-sm break-words">{formatVinFieldValue(value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[0.7rem] text-muted-foreground mt-2">
                {t(
                  'vin.result_hint',
                  'Values are approximate technical data based on VIN decode and may differ from official documents.',
                )}
              </p>
            </>
          )}
        </div>
        {canSearchCatalog && (
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleGoToCatalog}
            >
              <Icon icon="mdi:magnify" className="me-2 h-3 w-3" />
              {t('vin.cta_find_companies', 'Find import companies for this vehicle')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VinDecodeResultCard

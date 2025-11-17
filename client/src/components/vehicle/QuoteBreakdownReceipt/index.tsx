import React from 'react'
import PropTypes from 'prop-types'
import { Card, CardContent } from '@/components/ui/card'
import type { QuoteBreakdown } from '@/types/vehicles'

interface QuoteBreakdownReceiptProps {
  breakdown: QuoteBreakdown
  companyName: string
}

const formatCurrency = (value: number): string => {
  if (Number.isNaN(value)) return '-'
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

const QuoteBreakdownReceipt: React.FC<QuoteBreakdownReceiptProps> = ({ breakdown, companyName }) => {
  return (
    <Card className="mt-2 border-dashed bg-muted/40">
      <CardContent className="p-3 space-y-3 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs">
            დეტალური ფასი იმპორტზე
          </span>
          <span className="text-[10px] text-muted-foreground">
            {companyName}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Auction ფასი (ავტომობილი)</span>
            <span className="font-medium">${formatCurrency(breakdown.calc_price)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ტრანსპორტირება (მიწოდება)</span>
            <span className="font-medium">${formatCurrency(breakdown.shipping_total)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">საბაჟო გადასახადი</span>
            <span className="font-medium">${formatCurrency(breakdown.customs_fee)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">სერვისი და ბროკერი</span>
            <span className="font-medium">
              ${formatCurrency(breakdown.service_fee + breakdown.broker_fee)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">დაზღვევა</span>
            <span className="font-medium">${formatCurrency(breakdown.insurance_fee)}</span>
          </div>
        </div>

        <div className="pt-2 mt-1 border-t flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">სრული ფასი იმპორტზე</span>
          <span className="text-sm font-semibold">${formatCurrency(breakdown.total_price)}</span>
        </div>

        <p className="text-[10px] text-muted-foreground leading-snug mt-1">
          ამ ჩეკში ასახულია სრული ფასი იმპორტზე: აუქციონზე შეძენა, ავტომობილის ტრანსპორტირება აშშ-დან საქართველოს
          პორტამდე და დაახლოებით გათვლილი საბაჟო გადასახადი. სერვისისა და საბროკერო საკომისიო უკვე შედის მთლიან
          ღირებულებაში.
        </p>
      </CardContent>
    </Card>
  )
}

QuoteBreakdownReceipt.propTypes = {
  breakdown: PropTypes.shape({
    base_price: PropTypes.number.isRequired,
    distance_miles: PropTypes.number.isRequired,
    price_per_mile: PropTypes.number.isRequired,
    mileage_cost: PropTypes.number.isRequired,
    customs_fee: PropTypes.number.isRequired,
    service_fee: PropTypes.number.isRequired,
    broker_fee: PropTypes.number.isRequired,
    retail_value: PropTypes.number.isRequired,
    insurance_rate: PropTypes.number.isRequired,
    insurance_fee: PropTypes.number.isRequired,
    shipping_total: PropTypes.number.isRequired,
    calc_price: PropTypes.number.isRequired,
    total_price: PropTypes.number.isRequired,
    formula_source: PropTypes.string.isRequired,
  }).isRequired,
  companyName: PropTypes.string.isRequired,
}

export default QuoteBreakdownReceipt

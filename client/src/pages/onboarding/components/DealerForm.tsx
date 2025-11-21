import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { onboardingApi } from "@/services/onboardingService"
import { toast } from "sonner"
import { useState } from "react"
import { Icon } from "@iconify/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DEALER_INVENTORY_SIZES } from "@/constants/onboarding"
import { useOnboardingForm } from "@/hooks/useOnboardingForm"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

export function DealerForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)

  const dealerFormSchema = z.object({
    business_name: z.string().min(2, t('onboarding.dealer.validation.name_length')),
    tax_id: z.string().optional(),
    license_number: z.string().optional(),
    inventory_size: z.enum(['0-10', '10-50', '50+']).optional(), // Matched with constants
    feed_url: z.string().url(t('onboarding.dealer.validation.url_invalid')).optional().or(z.literal("")),
  })

  type DealerFormValues = z.infer<typeof dealerFormSchema>

  const { form, triggerConfetti } = useOnboardingForm<DealerFormValues>('dealer', {
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      business_name: "",
      tax_id: "",
      license_number: "",
      feed_url: "",
    },
  })

  async function onSubmit(data: DealerFormValues) {
    setIsLoading(true)
    try {
      await onboardingApi.submitDealerOnboarding(data)
      toast.success(t('onboarding.dealer.success'))
      triggerConfetti()
    } catch (error) {
      toast.error(t('onboarding.dealer.failure'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{t('onboarding.dealer.title')}</CardTitle>
                <CardDescription>{t('onboarding.dealer.description')}</CardDescription>
            </div>
            <Badge variant="secondary" className="flex gap-1 items-center">
                <Icon icon="mdi:shield-check" className="text-green-600" />
                {t('onboarding.dealer.program')}
            </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.dealer.business_name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('onboarding.placeholders.dealer_name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                        <FormLabel>{t('onboarding.dealer.tax_id')}</FormLabel>
                        <Tooltip>
                            <TooltipTrigger type="button">
                                <Icon icon="mdi:help-circle-outline" className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('onboarding.dealer.tax_id_desc')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <FormControl>
                      <Input placeholder={t('onboarding.placeholders.license')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.dealer.license')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('onboarding.placeholders.dealer_license')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inventory_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.dealer.inventory_size')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('onboarding.placeholders.sales_volume')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEALER_INVENTORY_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>{size} {t('common.vehicle')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="feed_url"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>{t('onboarding.dealer.feed_url')}</FormLabel>
                    <Tooltip>
                        <TooltipTrigger type="button">
                            <Icon icon="mdi:help-circle-outline" className="text-muted-foreground h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('onboarding.dealer.feed_url_desc')}</p>
                        </TooltipContent>
                    </Tooltip>
                  </div>
                  <FormControl>
                    <Input placeholder={t('onboarding.placeholders.feed_url')} {...field} />
                  </FormControl>
                  <FormDescription>{t('onboarding.dealer.feed_format_hint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
              {t('onboarding.dealer.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

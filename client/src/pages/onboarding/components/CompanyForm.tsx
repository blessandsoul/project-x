import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { onboardingApi } from "@/services/onboardingService"
import { toast } from "sonner"
import { useState } from "react"
import { Icon } from "@iconify/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SERVICES } from "@/constants/onboarding"
import { useOnboardingForm } from "@/hooks/useOnboardingForm"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"

export function CompanyForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)

  const companyFormSchema = z.object({
    name: z.string().min(2, t('onboarding.company.validation.name_length')),
    slug: z.string().optional(),
    base_price: z.coerce.number().min(0, t('onboarding.company.validation.price_negative')),
    price_per_mile: z.coerce.number().min(0, t('onboarding.company.validation.price_negative')),
    customs_fee: z.coerce.number().min(0).optional(),
    service_fee: z.coerce.number().min(0).optional(),
    broker_fee: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    contact_email: z.string().email().optional(),
    website: z.string().url().optional(),
    established_year: z.coerce.number().optional(),
    phone_number: z.string().optional(),
    services: z.array(z.string()).optional(),
    social_links: z.array(z.object({ url: z.string().url() })).optional(),
  })

  type CompanyFormValues = z.infer<typeof companyFormSchema>

  const { form, triggerConfetti } = useOnboardingForm<CompanyFormValues>('company', {
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      base_price: 0,
      price_per_mile: 0,
      customs_fee: 0,
      service_fee: 0,
      broker_fee: 0,
      description: "",
      country: "",
      city: "",
      phone_number: "",
      contact_email: "",
      website: "",
      established_year: new Date().getFullYear(),
      services: [],
      social_links: []
    },
  })

  async function onSubmit(data: CompanyFormValues) {
    setIsLoading(true)
    try {
      await onboardingApi.submitCompanyOnboarding(data)
      toast.success(t('onboarding.company.success'))
      triggerConfetti()
    } catch (error) {
      toast.error(t('onboarding.company.failure'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('onboarding.company.title')}</CardTitle>
        <CardDescription>{t('onboarding.company.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.company.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('onboarding.placeholders.company_name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="company-slug" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.company.contact_phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.placeholders.phone')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="established_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Established Year (Timestamp)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Year or Timestamp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Company description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.company.base_fee')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_per_mile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onboarding.company.price_per_mile')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customs_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customs Fee</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="service_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Fee</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="broker_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker Fee</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="services"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">{t('onboarding.company.services')}</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICES.map((svc) => (
                      <FormField
                        key={svc}
                        control={form.control}
                        name="services"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={svc}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(svc)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), svc])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== svc
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {svc}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
                <FormLabel>Social Links</FormLabel>
                {form.watch("social_links")?.map((_, index) => (
                    <FormField
                        key={index}
                        control={form.control}
                        name={`social_links.${index}.url`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="https://social.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const current = form.getValues("social_links") || [];
                        form.setValue("social_links", [...current, { url: "" }]);
                    }}
                >
                    Add Social Link
                </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
              {t('onboarding.company.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

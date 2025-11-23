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
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Icon } from "@iconify/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SERVICES } from "@/constants/onboarding"
import { useOnboardingForm } from "@/hooks/useOnboardingForm"
import { API_BASE_URL } from "@/lib/apiClient"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/hooks/useAuth"
import { fetchRawCompanyByIdFromApi, updateCompanyFromApi, createCompanySocialLinkFromApi, uploadCompanyLogoFromApi, deleteCompanySocialLinkFromApi } from "@/services/companiesApi"

export function CompanyForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)
  const [isPrefilling, setIsPrefilling] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)
  const [, setInitialSocialLinks] = useState<string[]>([])
  const { isAuthenticated, userRole, companyId } = useAuth();
  const navigate = useNavigate()

  const companyFormSchema = z.object({
    name: z.string().min(2, t('onboarding.company.validation.name_length')),
    slug: z.string().optional(),
    base_price: z.coerce.number().min(0, t('onboarding.company.validation.price_negative')),
    price_per_mile: z.coerce.number().min(0, t('onboarding.company.validation.price_negative')),
    customs_fee: z.coerce.number().min(0).optional(),
    service_fee: z.coerce.number().min(0).optional(),
    broker_fee: z.coerce.number().min(0).optional(),
    insurance: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    contact_email: z.string().email().optional(),
    website: z.string().url().optional(),
    established_year: z.coerce.number().optional(),
    phone_number: z.string().optional(),
    services: z.array(z.string()).optional(),
    social_links: z.array(z.object({
      id: z.union([z.string(), z.number()]).optional(),
      url: z.string().url(),
    })).optional(),
  })

  type CompanyFormValues = z.infer<typeof companyFormSchema>

  const { form, triggerConfetti } = useOnboardingForm<CompanyFormValues>('company', {
    resolver: zodResolver(companyFormSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      base_price: 0,
      price_per_mile: 0,
      customs_fee: 0,
      service_fee: 0,
      broker_fee: 0,
      insurance: 0,
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

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'company' || !companyId) {
      return
    }

    let isMounted = true
    setIsPrefilling(true)

    console.log('[CompanyOnboarding] Prefill start', {
      isAuthenticated,
      userRole,
      companyId,
    })

    fetchRawCompanyByIdFromApi(companyId)
      .then((company) => {
        if (!company || !isMounted) {
          return
        }

        console.log('[CompanyOnboarding] Prefill loaded company', company)

        const services = Array.isArray(company.services) ? company.services : []
        const socialLinksArray = Array.isArray(company.social_links) ? company.social_links : []

        const establishedYear = (() => {
          if (typeof company.established_year !== 'number' || Number.isNaN(company.established_year)) {
            return new Date(company.created_at).getFullYear()
          }

          const numeric = company.established_year

          // If it already looks like a normal calendar year, use it directly.
          if (numeric >= 1900 && numeric <= 2100) {
            return numeric
          }

          // Fallback for legacy data where a Unix timestamp (in seconds) was stored.
          // This also covers negative/offset values like -14400.
          const fromTimestamp = new Date(numeric * 1000)
          const tsYear = fromTimestamp.getUTCFullYear()

          if (tsYear >= 1900 && tsYear <= 2100) {
            return tsYear
          }

          // Last-resort fallback: created_at year.
          return new Date(company.created_at).getFullYear()
        })()

        const normalizedSocialLinks = socialLinksArray
          .filter((link) => link && typeof link.url === 'string' && link.url.trim().length > 0)
          .map((link) => ({ id: link.id, url: (link.url ?? '').trim() }))

        setInitialSocialLinks(normalizedSocialLinks.map((link) => link.url))

        let logoUrl: string | null = null
        const rawLogo =
          (typeof company.logo_url === 'string' && company.logo_url.trim().length > 0
            ? company.logo_url.trim()
            : typeof (company as any).logo === 'string' && (company as any).logo.trim().length > 0
              ? (company as any).logo.trim()
              : null)

        // Normalize logo URL to avoid CORP:
        // - If it's absolute and matches API_BASE_URL, strip the origin so the
        //   browser requests it from the frontend origin (dev proxy can handle it).
        // - If it's another absolute URL, use as-is.
        // - If it's relative, use as-is.
        if (rawLogo) {
          if (rawLogo.startsWith(API_BASE_URL)) {
            logoUrl = rawLogo.slice(API_BASE_URL.length) || '/'
          } else {
            logoUrl = rawLogo
          }
        }

        // Debug: verify what URL we are trying to load
        console.log('[CompanyOnboarding] Resolved logo URL', {
          logo_url: company.logo_url,
          logo: (company as any).logo,
          resolved: logoUrl,
        })

        setCurrentLogoUrl(logoUrl)

        form.reset({
          name: company.name || "",
          slug: company.slug || "",
          base_price: Number(company.base_price) || 0,
          price_per_mile: Number(company.price_per_mile) || 0,
          customs_fee: Number(company.customs_fee) || 0,
          service_fee: Number(company.service_fee) || 0,
          broker_fee: Number(company.broker_fee) || 0,
          insurance: company.insurance != null ? Number(company.insurance) || 0 : 0,
          description: company.description || "",
          country: company.country || "",
          city: company.city || "",
          phone_number: company.phone_number || "",
          contact_email: company.contact_email || "",
          website: company.website || "",
          established_year: establishedYear,
          services,
          social_links: normalizedSocialLinks,
        })
      })
      .catch((error) => {
        console.error('[CompanyOnboarding] Failed to prefill company data', error)
      })
      .finally(() => {
        if (isMounted) {
          setIsPrefilling(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, userRole, companyId, form])

  async function onSubmit(data: CompanyFormValues) {
    if (!companyId) {
      toast.error(t('onboarding.company.failure'))
      console.error('[CompanyOnboarding] Missing companyId in auth state')
      return
    }

    setIsLoading(true)

    try {
      const sanitizedServices = Array.isArray(data.services)
        ? data.services.filter((svc) => typeof svc === 'string' && svc.trim().length > 0)
        : []

      const socialLinks = Array.isArray(data.social_links)
        ? data.social_links.filter((item) => item && typeof item.url === 'string' && item.url.trim().length > 0)
        : []

      const year = typeof data.established_year === 'number'
        ? data.established_year
        : new Date().getFullYear()

      const payload = {
        name: data.name,
        base_price: data.base_price,
        customs_fee: data.customs_fee ?? undefined,
        service_fee: data.service_fee ?? undefined,
        broker_fee: data.broker_fee ?? undefined,
        insurance: data.insurance ?? undefined,
        price_per_mile: data.price_per_mile,
        description: data.description || null,
        country: data.country || null,
        city: data.city || null,
        phone_number: data.phone_number || null,
        contact_email: data.contact_email || null,
        website: data.website || null,
        established_year: year,
        services: sanitizedServices.length > 0 ? sanitizedServices : undefined,
      }

      await updateCompanyFromApi(companyId, payload)

      const newSocialLinks = socialLinks.filter((link) => !link.id)

      if (newSocialLinks.length > 0) {
        await Promise.all(
          newSocialLinks.map((link) =>
            createCompanySocialLinkFromApi(companyId, link.url.trim()),
          ),
        )
      }

      if (logoFile) {
        try {
          await uploadCompanyLogoFromApi(companyId, logoFile)
        } catch (error) {
          console.error('[CompanyOnboarding] Logo upload failed', error)
          toast.error(t('onboarding.company.failure'))
          return
        }
      }

      toast.success(t('onboarding.company.success'))
      triggerConfetti()
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (error) {
      toast.error(t('onboarding.company.failure'))
      console.error('[CompanyOnboarding] Submit failed', error)
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
              <div className="space-y-2">
                <FormLabel>Company Logo</FormLabel>
                {currentLogoUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={currentLogoUrl}
                      alt="Current company logo"
                      className="h-12 w-12 rounded-md object-contain border"
                    />
                    <span className="text-sm text-muted-foreground">Current logo</span>
                  </div>
                )}
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      setLogoFile(file)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </div>
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
                    <FormLabel>Established Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 2015" {...field} />
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
              <FormField
                control={form.control}
                name="insurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance</FormLabel>
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
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder="https://social.com/..." {...field} />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      const current = form.getValues("social_links") || [];
                                      const link = current[index];

                                      form.setValue(
                                        "social_links",
                                        current.filter((_, i) => i !== index),
                                      );

                                      const url = (link?.url ?? "").trim();
                                      if (url) {
                                        setInitialSocialLinks((prev) => prev.filter((item) => item !== url));
                                      }

                                      if (link && link.id) {
                                        try {
                                          await deleteCompanySocialLinkFromApi(link.id);
                                        } catch (error) {
                                          console.error('[CompanyOnboarding] Failed to delete social link', error);
                                          toast.error(t('onboarding.company.failure'));
                                        }
                                      }
                                    }}
                                  >
                                    <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                                  </Button>
                                </div>
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

            <Button type="submit" className="w-full" disabled={isLoading || isPrefilling}>
              {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
              {t('onboarding.company.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

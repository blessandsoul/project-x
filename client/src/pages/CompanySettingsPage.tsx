import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Icon } from '@iconify/react'
import { useAuth } from '@/hooks/useAuth'
import { SERVICES } from '@/constants/onboarding'
import { API_BASE_URL } from '@/lib/apiClient'
import {
  fetchRawCompanyByIdFromApi,
  updateCompanyFromApi,
  deleteCompanyFromApi,
  uploadCompanyLogoFromApi,
  createCompanySocialLinkFromApi,
  deleteCompanySocialLinkFromApi,
  type ApiCompany,
} from '@/services/companiesApi'
import { toast } from 'sonner'

type SocialLink = {
  id?: string | number
  url: string
}

const CompanySettingsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isLoading: authLoading, companyId, refreshProfile } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [establishedYear, setEstablishedYear] = useState<number>(new Date().getFullYear())
  const [basePrice, setBasePrice] = useState<number>(0)
  const [pricePerMile, setPricePerMile] = useState<number>(0)
  const [customsFee, setCustomsFee] = useState<number>(0)
  const [serviceFee, setServiceFee] = useState<number>(0)
  const [brokerFee, setBrokerFee] = useState<number>(0)
  const [services, setServices] = useState<string[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)

  // Load company data
  useEffect(() => {
    if (!companyId) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    fetchRawCompanyByIdFromApi(companyId)
      .then((company: ApiCompany | null) => {
        if (!company || !isMounted) return

        setName(company.name || '')
        setDescription(company.description || '')
        setContactEmail(company.contact_email || '')
        setPhoneNumber(company.phone_number || '')
        setWebsite(company.website || '')
        setCountry(company.country || '')
        setCity(company.city || '')
        setBasePrice(Number(company.base_price) || 0)
        setPricePerMile(Number(company.price_per_mile) || 0)
        setCustomsFee(Number(company.customs_fee) || 0)
        setServiceFee(Number(company.service_fee) || 0)
        setBrokerFee(Number(company.broker_fee) || 0)
        setServices(Array.isArray(company.services) ? company.services : [])

        // Handle established year
        const year = company.established_year
        if (typeof year === 'number' && year >= 1900 && year <= 2100) {
          setEstablishedYear(year)
        } else {
          setEstablishedYear(new Date(company.created_at).getFullYear())
        }

        // Handle social links
        const links = Array.isArray(company.social_links)
          ? company.social_links
              .filter((link) => link && typeof link.url === 'string' && link.url.trim().length > 0)
              .map((link) => ({ id: link.id, url: link.url || '' }))
          : []
        setSocialLinks(links)

        // Handle logo URL - resolve to full URL for display
        const rawLogo = company.logo_url || (company as any).logo || null
        if (rawLogo && typeof rawLogo === 'string' && rawLogo.trim().length > 0) {
          // If it's already an absolute URL, use as-is
          if (rawLogo.startsWith('http')) {
            setCurrentLogoUrl(rawLogo)
          } else {
            // Relative path - prepend API_BASE_URL
            setCurrentLogoUrl(`${API_BASE_URL}${rawLogo}`)
          }
        }
      })
      .catch((err) => {
        console.error('[CompanySettings] Failed to load company', err)
        setError(t('company_settings.error.load'))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [companyId, t])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!companyId) return

    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      // Update company details
      await updateCompanyFromApi(companyId, {
        name: name.trim(),
        description: description.trim() || null,
        contact_email: contactEmail.trim() || null,
        phone_number: phoneNumber.trim() || null,
        website: website.trim() || null,
        country: country.trim() || null,
        city: city.trim() || null,
        established_year: establishedYear,
        base_price: basePrice,
        price_per_mile: pricePerMile,
        customs_fee: customsFee,
        service_fee: serviceFee,
        broker_fee: brokerFee,
        services: services.length > 0 ? services : undefined,
      })

      // Handle new social links (those without id)
      const newLinks = socialLinks.filter((link) => !link.id && link.url.trim())
      if (newLinks.length > 0) {
        await Promise.all(
          newLinks.map((link) => createCompanySocialLinkFromApi(companyId, link.url.trim()))
        )
      }

      // Upload logo if changed
      if (logoFile) {
        await uploadCompanyLogoFromApi(companyId, logoFile)
        setLogoFile(null)
      }

      await refreshProfile()
      setSuccess(t('company_settings.success'))
      toast.success(t('company_settings.success'))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('company_settings.error.save')
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!companyId) return

    setError('')
    setIsDeleting(true)

    try {
      await deleteCompanyFromApi(companyId)
      await refreshProfile()
      toast.success(t('company_settings.delete_success'))
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('company_settings.error.delete')
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
    }
  }

  const handleServiceToggle = (service: string, checked: boolean) => {
    if (checked) {
      setServices((prev) => [...prev, service])
    } else {
      setServices((prev) => prev.filter((s) => s !== service))
    }
  }

  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [...prev, { url: '' }])
  }

  const handleRemoveSocialLink = async (index: number) => {
    const link = socialLinks[index]
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))

    // If link has an id, delete it from server
    if (link?.id && companyId) {
      try {
        await deleteCompanySocialLinkFromApi(link.id)
      } catch (err) {
        console.error('[CompanySettings] Failed to delete social link', err)
        toast.error(t('company_settings.error.delete_link'))
      }
    }
  }

  const handleSocialLinkChange = (index: number, url: string) => {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, url } : link))
    )
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // No company state
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center p-6">
          <CardHeader>
            <CardTitle>{t('company_settings.no_company')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('company_settings.no_company_description')}
            </p>
            <Button onClick={() => navigate('/company/onboard')} className="w-full">
              <Icon icon="mdi:domain-plus" className="me-2 h-4 w-4" />
              {t('company_settings.create_company')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="space-y-2">
            <div className="relative flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-0 h-8 w-8"
                onClick={() => navigate(-1)}
              >
                <Icon icon="mdi:arrow-left" className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Icon icon="mdi:domain" className="h-10 w-10 text-primary" />
                  <CardTitle className="text-2xl font-bold">
                    {t('company_settings.title')}
                  </CardTitle>
                </div>
              </div>
            </div>
            <CardDescription className="text-center">
              {t('company_settings.description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Section */}
              <div className="space-y-2">
                <Label>{t('company_settings.logo')}</Label>
                <div className="flex items-center gap-4">
                  {currentLogoUrl && (
                    <img
                      src={currentLogoUrl}
                      alt="Company logo"
                      className="h-16 w-16 rounded-md object-contain border"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={isSaving || isDeleting}
                  />
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('company_settings.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('company_settings.name_placeholder')}
                    required
                    disabled={isSaving || isDeleting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">{t('company_settings.established_year')}</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(Number(e.target.value))}
                    min={1900}
                    max={2100}
                    disabled={isSaving || isDeleting}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">{t('company_settings.contact_email')}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@company.com"
                    disabled={isSaving || isDeleting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('company_settings.phone')}</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    disabled={isSaving || isDeleting}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">{t('company_settings.country')}</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t('company_settings.country_placeholder')}
                    disabled={isSaving || isDeleting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('company_settings.city')}</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('company_settings.city_placeholder')}
                    disabled={isSaving || isDeleting}
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">{t('company_settings.website')}</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSaving || isDeleting}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('company_settings.description_label')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('company_settings.description_placeholder')}
                  rows={4}
                  disabled={isSaving || isDeleting}
                />
              </div>

              <Separator />

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('company_settings.pricing')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">{t('company_settings.base_price')}</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      min={0}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerMile">{t('company_settings.price_per_mile')}</Label>
                    <Input
                      id="pricePerMile"
                      type="number"
                      step="0.01"
                      value={pricePerMile}
                      onChange={(e) => setPricePerMile(Number(e.target.value))}
                      min={0}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customsFee">{t('company_settings.customs_fee')}</Label>
                    <Input
                      id="customsFee"
                      type="number"
                      value={customsFee}
                      onChange={(e) => setCustomsFee(Number(e.target.value))}
                      min={0}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceFee">{t('company_settings.service_fee')}</Label>
                    <Input
                      id="serviceFee"
                      type="number"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(Number(e.target.value))}
                      min={0}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brokerFee">{t('company_settings.broker_fee')}</Label>
                    <Input
                      id="brokerFee"
                      type="number"
                      value={brokerFee}
                      onChange={(e) => setBrokerFee(Number(e.target.value))}
                      min={0}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Services Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('company_settings.services')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={services.includes(service)}
                        onCheckedChange={(checked) =>
                          handleServiceToggle(service, checked === true)
                        }
                        disabled={isSaving || isDeleting}
                      />
                      <Label htmlFor={`service-${service}`} className="font-normal">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Social Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('company_settings.social_links')}</h3>
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.url}
                      onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                      placeholder="https://social.com/..."
                      disabled={isSaving || isDeleting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSocialLink(index)}
                      disabled={isSaving || isDeleting}
                    >
                      <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSocialLink}
                  disabled={isSaving || isDeleting}
                >
                  <Icon icon="mdi:plus" className="me-2 h-4 w-4" />
                  {t('company_settings.add_social_link')}
                </Button>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <p className="text-sm text-destructive" aria-live="polite">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-emerald-600" aria-live="polite">
                  {success}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving || isDeleting}
                >
                  {isSaving ? (
                    <>
                      <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                      {t('company_settings.saving')}
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:content-save" className="me-2 h-4 w-4" />
                      {t('company_settings.save')}
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                      disabled={isSaving || isDeleting}
                    >
                      <Icon icon="mdi:delete" className="me-2 h-4 w-4" />
                      {t('company_settings.delete_company')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('company_settings.delete_confirm_title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('company_settings.delete_confirm_description')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteCompany}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                            {t('company_settings.deleting')}
                          </>
                        ) : (
                          t('company_settings.delete_confirm')
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CompanySettingsPage

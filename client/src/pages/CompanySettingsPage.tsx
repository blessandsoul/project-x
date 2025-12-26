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
import { fetchServices, type Service } from '@/api/services'
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
  platform: 'facebook' | 'instagram'
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
  const [descriptionGeo, setDescriptionGeo] = useState('')
  const [descriptionEng, setDescriptionEng] = useState('')
  const [descriptionRus, setDescriptionRus] = useState('')
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
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)

  // Services from API
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)

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
        setDescriptionGeo(company.description_geo || '')
        setDescriptionEng(company.description_eng || '')
        setDescriptionRus(company.description_rus || '')
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

        // Handle social links - filter for social type and include platform
        const rawLinks = company.social_links
        if (Array.isArray(rawLinks)) {
          const mappedLinks = rawLinks
            .filter((link) =>
              link &&
              typeof link.url === 'string' &&
              link.url.trim().length > 0 &&
              link.link_type === 'social' // Only social links, not website
            )
            .map((link) => ({
              id: link.id,
              platform: (link.platform || 'facebook') as 'facebook' | 'instagram',
              url: link.url || '',
            }))
          setSocialLinks(mappedLinks)
        }

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

  // Fetch available services from API
  useEffect(() => {
    let mounted = true

    async function loadServices() {
      try {
        const apiServices = await fetchServices()
        if (mounted) {
          setAvailableServices(apiServices)
        }
      } catch (err) {
        console.error('[CompanySettings] Failed to load services:', err)
      } finally {
        if (mounted) {
          setIsLoadingServices(false)
        }
      }
    }

    loadServices()

    return () => {
      mounted = false
    }
  }, [])

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
        description_geo: descriptionGeo.trim() || null,
        description_eng: descriptionEng.trim() || null,
        description_rus: descriptionRus.trim() || null,
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
          newLinks.map((link) =>
            createCompanySocialLinkFromApi(companyId, 'social', link.url.trim(), link.platform)
          )
        )
      }

      // Upload logo if changed
      if (logoFile) {
        const logoResult = await uploadCompanyLogoFromApi(companyId, logoFile)
        // Update displayed logo URL immediately from server response
        if (logoResult.logoUrl) {
          const fullLogoUrl = logoResult.logoUrl.startsWith('http')
            ? logoResult.logoUrl
            : `${API_BASE_URL}${logoResult.logoUrl}`
          setCurrentLogoUrl(fullLogoUrl)
        }
        // Clean up preview URL
        if (logoPreviewUrl) {
          URL.revokeObjectURL(logoPreviewUrl)
          setLogoPreviewUrl(null)
        }
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
      navigate('/dashboard', { replace: true })
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
      // Create immediate preview URL
      const previewUrl = URL.createObjectURL(file)
      setLogoPreviewUrl(previewUrl)
    }
  }

  const handleServiceToggle = (service: string, checked: boolean) => {
    if (checked) {
      setServices((prev) => [...prev, service])
    } else {
      setServices((prev) => prev.filter((s) => s !== service))
    }
  }

  // Compute used platforms
  const usedPlatforms = socialLinks.map((link) => link.platform)

  const handleSocialLinkChange = (index: number, field: 'url' | 'platform', value: string) => {
    setSocialLinks((prev) =>
      prev.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    )
  }

  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: 'facebook', url: '' }])
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
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label={t('common.back', 'Go back')}
          >
            <Icon icon="mdi:arrow-left" className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('company_settings.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('company_settings.description')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Responsive Grid Layout:
                - Mobile (<768px): Single column, vertical stack
                - Tablet (768px-1024px): 2-column grid, 2 sections per row
                - Desktop (≥1024px): 2-column grid with proper spacing
            */}

            {/* Row 1: Company Information (Left) + Company Descriptions (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Info Section - Left */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:domain" className="h-5 w-5" />
                    {t('company_settings.company_info', 'Company Information')}
                  </CardTitle>
                  <CardDescription>
                    {t('company_settings.company_info_description', 'Basic information about your company')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="phoneNumber">{t('company_settings.phone')}</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t('company_settings.phone_placeholder', '+1 234 567 8900')}
                      disabled={isSaving || isDeleting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">{t('company_settings.contact_email')}</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder={t('company_settings.email_placeholder', 'contact@company.com')}
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
                </CardContent>
              </Card>

              {/* Company Descriptions Section - Right */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:text-box-multiple" className="h-5 w-5" />
                    {t('company_settings.descriptions', 'Company Descriptions')}
                  </CardTitle>
                  <CardDescription>
                    {t('company_settings.descriptions_description', 'Describe your company in multiple languages')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionGeo" className="flex items-center justify-between">
                      <span>{t('company_settings.description_geo', 'Description (Georgian)')}</span>
                      <span className="text-xs text-muted-foreground">
                        {descriptionGeo.length}/5000
                      </span>
                    </Label>
                    <Textarea
                      id="descriptionGeo"
                      value={descriptionGeo}
                      onChange={(e) => setDescriptionGeo(e.target.value)}
                      placeholder={t('company_settings.description_geo_placeholder', 'აღწერა ქართულად...')}
                      disabled={isSaving || isDeleting}
                      rows={3}
                      maxLength={5000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionEng" className="flex items-center justify-between">
                      <span>{t('company_settings.description_eng', 'Description (English)')}</span>
                      <span className="text-xs text-muted-foreground">
                        {descriptionEng.length}/5000
                      </span>
                    </Label>
                    <Textarea
                      id="descriptionEng"
                      value={descriptionEng}
                      onChange={(e) => setDescriptionEng(e.target.value)}
                      placeholder={t('company_settings.description_eng_placeholder', 'Description in English...')}
                      disabled={isSaving || isDeleting}
                      rows={3}
                      maxLength={5000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionRus" className="flex items-center justify-between">
                      <span>{t('company_settings.description_rus', 'Description (Russian)')}</span>
                      <span className="text-xs text-muted-foreground">
                        {descriptionRus.length}/5000
                      </span>
                    </Label>
                    <Textarea
                      id="descriptionRus"
                      value={descriptionRus}
                      onChange={(e) => setDescriptionRus(e.target.value)}
                      placeholder={t('company_settings.description_rus_placeholder', 'Описание на русском...')}
                      disabled={isSaving || isDeleting}
                      rows={3}
                      maxLength={5000}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Company Logo (Left) + Pricing (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Logo Section */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:image" className="h-5 w-5" />
                    {t('company_settings.logo', 'Company Logo')}
                  </CardTitle>
                  <CardDescription>
                    {t('company_settings.logo_description', 'Upload your company logo (max 2 MB, JPEG/PNG/WEBP)')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(logoPreviewUrl || currentLogoUrl) ? (
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={logoPreviewUrl || currentLogoUrl || ''}
                          alt="Company logo"
                          className="w-24 h-24 object-contain rounded-lg border bg-muted"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={isSaving || isDeleting}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('company_settings.logo_change', 'Click to change logo')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={isSaving || isDeleting}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('company_settings.logo_hint', 'JPEG, PNG, or WEBP up to 2 MB')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Section */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:currency-usd" className="h-5 w-5" />
                    {t('company_settings.pricing', 'Pricing')}
                  </CardTitle>
                  <CardDescription>
                    {t('company_settings.pricing_description', 'Set your pricing structure')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">{t('company_settings.base_price')}</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        min={0}
                        step={0.01}
                        disabled={isSaving || isDeleting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricePerMile">{t('company_settings.price_per_mile')}</Label>
                      <Input
                        id="pricePerMile"
                        type="number"
                        value={pricePerMile}
                        onChange={(e) => setPricePerMile(Number(e.target.value))}
                        min={0}
                        step={0.01}
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
                        step={0.01}
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
                        step={0.01}
                        disabled={isSaving || isDeleting}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="brokerFee">{t('company_settings.broker_fee')}</Label>
                      <Input
                        id="brokerFee"
                        type="number"
                        value={brokerFee}
                        onChange={(e) => setBrokerFee(Number(e.target.value))}
                        min={0}
                        step={0.01}
                        disabled={isSaving || isDeleting}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Website & Social Links (Left) + Location (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Website & Social Links Section */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:web" className="h-5 w-5" />
                    {t('company_settings.website_social', 'Website & Social Links')}
                  </CardTitle>
                  <CardDescription>
                    {t('company_settings.website_social_description', 'Add your company website and social media profiles')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Website Input */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Icon icon="mdi:web" className="h-4 w-4" />
                      {t('company_settings.website_label', 'Company Website')}
                    </Label>
                    <Input
                      placeholder="https://yourcompany.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={isSaving || isDeleting}
                    />
                  </div>

                  <Separator />

                  {/* Social Links Section */}
                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon icon="mdi:share-variant" className="h-4 w-4" />
                        {t('company_settings.social_links_label', 'Social Media Links')} ({socialLinks.length}/2)
                      </span>
                    </Label>

                    {socialLinks.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t('company_settings.no_social_links', 'No social links added.')}
                      </p>
                    )}

                    {socialLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={link.platform}
                          onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                          disabled={isSaving || isDeleting}
                          className="h-9 w-[130px] rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        >
                          <option
                            value="facebook"
                            disabled={usedPlatforms.includes('facebook') && link.platform !== 'facebook'}
                          >
                            Facebook
                          </option>
                          <option
                            value="instagram"
                            disabled={usedPlatforms.includes('instagram') && link.platform !== 'instagram'}
                          >
                            Instagram
                          </option>
                        </select>

                        <Input
                          value={link.url}
                          onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                          placeholder={link.platform === 'facebook' ? 'https://facebook.com/page' : 'https://instagram.com/page'}
                          disabled={isSaving || isDeleting}
                          className="flex-1"
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

                    {socialLinks.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSocialLink}
                        disabled={isSaving || isDeleting}
                        className="w-full"
                      >
                        <Icon icon="mdi:plus" className="me-2 h-4 w-4" />
                        {t('company_settings.add_social_link', 'Add Social Link')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location Section */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="mdi:map-marker" className="h-5 w-5" />
                    {t('company_settings.location', 'Location')}
                  </CardTitle>
                  <CardDescription>
                    {t('company_settings.location_description', 'Where your company is located')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">{t('company_settings.country')}</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder={t('company_settings.country_placeholder', 'United States')}
                      disabled={isSaving || isDeleting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('company_settings.city')}</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={t('company_settings.city_placeholder', 'New York')}
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 4: Services (Full Width) */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:briefcase" className="h-5 w-5" />
                  {t('company_settings.services', 'Services')}
                </CardTitle>
                <CardDescription>
                  {t('company_settings.services_description', 'Services your company offers')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingServices ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t('company_settings.loading_services', 'Loading services...')}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableServices.map((service) => (
                      <div key={service.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={services.includes(service.name)}
                          onCheckedChange={(checked) =>
                            handleServiceToggle(service.name, checked as boolean)
                          }
                          disabled={isSaving || isDeleting}
                        />
                        <Label htmlFor={`service-${service.id}`} className="font-normal cursor-pointer">
                          {service.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                {error && (
                  <p className="text-sm text-destructive mb-4">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-emerald-600 mb-4">{success}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={isSaving || isDeleting}
                    className="flex-1"
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
                        disabled={isSaving || isDeleting}
                      >
                        <Icon icon="mdi:delete" className="me-2 h-4 w-4" />
                        {t('company_settings.delete_company')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('company_settings.delete_confirm_title')}</AlertDialogTitle>
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
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanySettingsPage

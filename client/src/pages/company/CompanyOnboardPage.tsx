/**
 * Company Onboarding Page (Step 2 of 2-step registration)
 *
 * This page allows authenticated users WITHOUT a company to create one.
 * After successful onboarding:
 * - User role changes from 'user' to 'company'
 * - User gets assigned company_id
 * - User is redirected to their company page
 *
 * Features:
 * - Multiple websites support (first goes to company.website, rest as social links)
 * - Logo upload with preview and validation (max 2MB, JPEG/PNG/WEBP)
 * - Single "Create Company" button handles all steps atomically
 *
 * Route: /company/onboard
 * Guard: RequireNoCompany (auth required, no existing company)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

import { useAuth } from '@/hooks/useAuth'
import { onboardCompany, type OnboardError } from '@/services/companyOnboardService'
import { uploadCompanyLogo, validateLogoFile, formatFileSize, LOGO_MAX_SIZE_BYTES } from '@/services/companyLogoService'
import { createMultipleSocialLinks, isValidUrl, normalizeUrl } from '@/services/companySocialLinksService'
import { fetchServices, type Service } from '@/api/services'

// Form validation schema (websites handled separately as state)
const onboardFormSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  companyPhone: z.string().max(50).optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email address').max(255).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  establishedYear: z.coerce.number().min(1900).max(2100).optional().or(z.literal('')),
  services: z.array(z.string()).max(20).optional(),
  basePrice: z.coerce.number().min(0).optional(),
  pricePerMile: z.coerce.number().min(0).optional(),
  customsFee: z.coerce.number().min(0).optional(),
  serviceFee: z.coerce.number().min(0).optional(),
  brokerFee: z.coerce.number().min(0).optional(),
})

type OnboardFormValues = z.infer<typeof onboardFormSchema>

// Onboarding steps for progress display
type OnboardingStep = 'idle' | 'creating' | 'uploading_logo' | 'adding_websites' | 'refreshing' | 'done'

const STEP_LABELS: Record<OnboardingStep, string> = {
  idle: '',
  creating: 'Creating company...',
  uploading_logo: 'Uploading logo...',
  adding_websites: 'Adding websites...',
  refreshing: 'Finalizing...',
  done: 'Complete!',
}

const MAX_WEBSITES = 10

const CompanyOnboardPage = () => {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('idle')
  const [error, setError] = useState<OnboardError | null>(null)

  // Services state (fetched from API)
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)

  // Websites state (managed separately from form)
  const [websites, setWebsites] = useState<string[]>([])
  const [newWebsite, setNewWebsite] = useState('')
  const [websiteError, setWebsiteError] = useState<string | null>(null)

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  // Partial failure tracking
  const [partialFailures, setPartialFailures] = useState<string[]>([])

  const form = useForm<OnboardFormValues>({
    resolver: zodResolver(onboardFormSchema) as any,
    defaultValues: {
      name: '',
      companyPhone: '',
      contactEmail: '',
      country: '',
      city: '',
      state: '',
      description: '',
      establishedYear: undefined,
      services: [],
      basePrice: 0,
      pricePerMile: 0,
      customsFee: 0,
      serviceFee: 0,
      brokerFee: 0,
    },
  })

  const watchedServices = form.watch('services') || []

  // Service handlers
  const handleAddService = useCallback((service: string) => {
    const trimmed = service.trim()
    if (!trimmed) return
    if (watchedServices.length >= 20) {
      toast.error('Maximum 20 services allowed')
      return
    }
    if (watchedServices.includes(trimmed)) {
      toast.error('Service already added')
      return
    }
    form.setValue('services', [...watchedServices, trimmed])
  }, [watchedServices, form])

  const handleRemoveService = useCallback((service: string) => {
    form.setValue('services', watchedServices.filter(s => s !== service))
  }, [watchedServices, form])

  // Fetch services from API on mount
  useEffect(() => {
    let mounted = true

    async function loadServices() {
      try {
        const services = await fetchServices()
        if (mounted) {
          setAvailableServices(services)
        }
      } catch (err) {
        console.error('[Onboarding] Failed to load services:', err)
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

  // Website handlers
  const handleAddWebsite = useCallback(() => {
    setWebsiteError(null)
    const trimmed = newWebsite.trim()

    if (!trimmed) return

    if (websites.length >= MAX_WEBSITES) {
      setWebsiteError(`Maximum ${MAX_WEBSITES} websites allowed`)
      return
    }

    const normalized = normalizeUrl(trimmed)

    if (!isValidUrl(normalized)) {
      setWebsiteError('Invalid URL format. Use https://example.com')
      return
    }

    // Check for duplicates
    if (websites.some(w => normalizeUrl(w) === normalized)) {
      setWebsiteError('Website already added')
      return
    }

    setWebsites([...websites, normalized])
    setNewWebsite('')
  }, [newWebsite, websites])

  const handleRemoveWebsite = useCallback((index: number) => {
    setWebsites(websites.filter((_, i) => i !== index))
  }, [websites])

  const handleWebsiteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddWebsite()
    }
  }

  // Logo handlers
  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null)
    const file = e.target.files?.[0]

    if (!file) {
      setLogoFile(null)
      setLogoPreview(null)
      return
    }

    const validation = validateLogoFile(file)
    if (!validation.valid) {
      setLogoError(validation.error || 'Invalid file')
      e.target.value = ''
      return
    }

    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveLogo = useCallback(() => {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Main submit handler - atomic flow
  const onSubmit = async (data: OnboardFormValues) => {
    setIsSubmitting(true)
    setError(null)
    setPartialFailures([])
    setCurrentStep('creating')

    let companyId: number | null = null
    const failures: string[] = []

    try {
      // Step 0: Auto-add website from input if user typed but didn't click '+'
      // This prevents data loss when user expects the typed value to be saved
      let finalWebsites = [...websites]
      if (newWebsite.trim()) {
        const normalized = normalizeUrl(newWebsite.trim())
        if (isValidUrl(normalized) && !finalWebsites.some(w => normalizeUrl(w) === normalized)) {
          finalWebsites.push(normalized)
          console.log('[Onboarding] Auto-added website from input:', normalized)
        }
      }

      // Step 1: Create company
      // First website goes to company.website, ALL websites go to social links
      const primaryWebsite = finalWebsites.length > 0 ? finalWebsites[0] : undefined

      const payload = {
        name: data.name,
        companyPhone: data.companyPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        website: primaryWebsite,
        country: data.country || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        description: data.description || undefined,
        establishedYear: data.establishedYear || undefined,
        services: data.services?.length ? data.services : undefined,
        basePrice: data.basePrice || undefined,
        pricePerMile: data.pricePerMile || undefined,
        customsFee: data.customsFee || undefined,
        serviceFee: data.serviceFee || undefined,
        brokerFee: data.brokerFee || undefined,
      }

      const result = await onboardCompany(payload)
      companyId = result.company.id

      // Step 2: Upload logo (if selected)
      if (logoFile && companyId) {
        setCurrentStep('uploading_logo')
        try {
          await uploadCompanyLogo(companyId, logoFile)
        } catch (logoErr: any) {
          console.error('[Onboarding] Logo upload failed:', logoErr)
          failures.push(`Logo upload failed: ${logoErr.message || 'Unknown error'}`)
        }
      }

      // Step 3: Add ALL websites as social links
      // Note: First website is already in company.website, but we also create it as a social link
      // to match the behavior on settings page where website field and social links are independent
      if (finalWebsites.length > 0 && companyId) {
        setCurrentStep('adding_websites')
        console.log('[Onboarding] Creating social links for websites:', finalWebsites)
        try {
          const results = await createMultipleSocialLinks(companyId, finalWebsites)
          console.log('[Onboarding] Social links creation results:', results)
          const failedLinks = results.filter(r => !r.success)
          if (failedLinks.length > 0) {
            failures.push(`${failedLinks.length} website(s) failed to save`)
          }
        } catch (linksErr: any) {
          console.error('[Onboarding] Social links failed:', linksErr)
          failures.push('Failed to save websites')
        }
      }

      // Step 4: Refresh auth state
      setCurrentStep('refreshing')
      await refreshProfile()

      setCurrentStep('done')
      setPartialFailures(failures)

      // Show appropriate message
      if (failures.length > 0) {
        toast.warning('Company created with some issues', {
          description: 'Some extras failed. You can update them in company settings.',
        })
      } else {
        toast.success('Company created successfully!')
      }

      // Redirect to company page
      setTimeout(() => {
        navigate(`/company/${companyId}`, { replace: true })
      }, 1000)

    } catch (err) {
      const onboardError = err as OnboardError
      setError(onboardError)
      setCurrentStep('idle')

      switch (onboardError.type) {
        case 'unauthorized':
          toast.error('Please log in to continue')
          navigate('/login', { replace: true })
          break
        case 'conflict':
          toast.error('You already have a company')
          await refreshProfile()
          navigate('/dashboard', { replace: true })
          break
        case 'rate_limit':
          toast.error('Too many attempts. Please try again later.')
          break
        default:
          toast.error(onboardError.message)
      }
    } finally {
      if (currentStep !== 'done') {
        setIsSubmitting(false)
        setCurrentStep('idle')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon icon="mdi:truck-fast" className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create Your Company</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Set up your logistics company profile to start offering shipping services on Trusted Importers.
          </p>
        </div>

        {/* Error Alert */}
        {error && error.type !== 'unauthorized' && error.type !== 'conflict' && (
          <Alert variant="destructive">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Partial Failures Alert */}
        {partialFailures.length > 0 && (
          <Alert>
            <Icon icon="mdi:alert" className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Company created, but some extras failed:</p>
              <ul className="list-disc list-inside mt-1 text-sm">
                {partialFailures.map((failure, i) => (
                  <li key={i}>{failure}</li>
                ))}
              </ul>
              <p className="text-sm mt-2">You can update these in company settings.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress indicator during submission */}
        {isSubmitting && currentStep !== 'idle' && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Icon icon="mdi:loading" className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">{STEP_LABELS[currentStep]}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:domain" className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic information about your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1-555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@company.com" {...field} />
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
                        <Textarea
                          placeholder="Tell customers about your company and services..."
                          className="min-h-[100px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {(field.value?.length || 0)} / 5000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="establishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Established Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2015"
                          min={1900}
                          max={2100}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Logo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:image" className="h-5 w-5" />
                  Company Logo
                </CardTitle>
                <CardDescription>
                  Upload your company logo (max {LOGO_MAX_SIZE_BYTES / (1024 * 1024)} MB, JPEG/PNG/WEBP)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {logoPreview ? (
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain rounded-lg border bg-muted"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <Icon icon="mdi:close" className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium truncate">{logoFile?.name}</p>
                      <p className="text-muted-foreground">
                        {logoFile && formatFileSize(logoFile.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon icon="mdi:cloud-upload" className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, or WEBP up to {LOGO_MAX_SIZE_BYTES / (1024 * 1024)} MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                />

                {logoError && (
                  <p className="text-sm text-destructive">{logoError}</p>
                )}
              </CardContent>
            </Card>

            {/* Websites Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:web" className="h-5 w-5" />
                  Websites
                </CardTitle>
                <CardDescription>
                  Add your company websites (max {MAX_WEBSITES}). First website will be your primary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Website list */}
                {websites.length > 0 && (
                  <div className="space-y-2">
                    {websites.map((website, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                          <Icon icon="mdi:link" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate flex-1">{website}</span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">Primary</Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => handleRemoveWebsite(index)}
                        >
                          <Icon icon="mdi:close" className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add website input */}
                {websites.length < MAX_WEBSITES && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://yourcompany.com"
                        value={newWebsite}
                        onChange={(e) => {
                          setNewWebsite(e.target.value)
                          setWebsiteError(null)
                        }}
                        onKeyDown={handleWebsiteKeyDown}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddWebsite}
                        disabled={!newWebsite.trim()}
                      >
                        <Icon icon="mdi:plus" className="h-4 w-4" />
                      </Button>
                    </div>
                    {websiteError && (
                      <p className="text-sm text-destructive">{websiteError}</p>
                    )}
                  </div>
                )}

                {websites.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No websites added yet. Add your company website above.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:map-marker" className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  Where is your company based?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl>
                          <Input placeholder="California" {...field} />
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
                          <Input placeholder="Los Angeles" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:cog" className="h-5 w-5" />
                  Services
                </CardTitle>
                <CardDescription>
                  What services does your company offer? (Max 20)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available services from API */}
                {isLoadingServices ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading services...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableServices.map((service) => {
                      const isSelected = watchedServices.includes(service.name)
                      return (
                        <Badge
                          key={service.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer transition-colors"
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveService(service.name)
                            } else {
                              handleAddService(service.name)
                            }
                          }}
                        >
                          {isSelected && <Icon icon="mdi:check" className="h-3 w-3 mr-1" />}
                          {service.name}
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Selected services display */}
                {watchedServices.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Selected Services ({watchedServices.length}/20)</Label>
                      <div className="flex flex-wrap gap-2">
                        {watchedServices.map((service) => (
                          <Badge key={service} variant="secondary" className="gap-1">
                            {service}
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service)}
                              className="ml-1 hover:text-destructive"
                            >
                              <Icon icon="mdi:close" className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pricing Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:currency-usd" className="h-5 w-5" />
                  Pricing
                </CardTitle>
                <CardDescription>
                  Set your base pricing structure (all values in USD)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricePerMile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Mile</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customsFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customs Fee</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Fee</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brokerFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Broker Fee</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                    {STEP_LABELS[currentStep] || 'Processing...'}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
                    Create Company
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default CompanyOnboardPage

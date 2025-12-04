import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'

const RegisterPage = () => {
  const { t } = useTranslation()
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [accountType, setAccountType] = useState<'user' | 'dealer' | 'company'>('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [error, setError] = useState('')

  // Sync account type from ?type= query param on first load and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const type = params.get('type')

    if (type === 'user' || type === 'dealer' || type === 'company') {
      setAccountType(type)
    }
  }, [location.search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password) {
      setError(t('auth.register.error.required'))
      return
    }

    if (accountType === 'company' && (!companyName || !companyPhone)) {
      setError(t('auth.register.error.required'))
      return
    }

    try {
      const role = accountType
      const extraCompanyName = accountType === 'company' ? companyName : undefined
      const extraCompanyPhone = accountType === 'company' ? companyPhone : undefined

      await register(name, email, password, role, extraCompanyName, extraCompanyPhone)
      navigate(`/onboarding/${accountType}`, { replace: true })
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('auth.register.error.generic')

      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-lg border-0 sm:border sm:shadow-sm overflow-hidden" role="form" aria-label={t('auth.register.title')}>
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(-1)}
                aria-label={t('common.back')}
              >
                <Icon icon="mdi:arrow-left" className="h-4 w-4" />
              </Button>
              <Button
                asChild
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label={t('navigation.home')}
              >
                <Link to="/">
                  <Icon icon="mdi:home" className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Link to="/" className="mx-auto flex items-center gap-2 mb-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20"
              >
                <Icon icon="mdi:shield-check" className="h-6 w-6" />
              </motion.div>
            </Link>
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.register.title')}</CardTitle>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t('auth.register.subtitle', 'Create an account to start using Trusted Importers.')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
              
              {/* Account Type Selection */}
              <div className="space-y-4 text-center">
                <Label className="text-xs font-bold uppercase text-muted-foreground/70 tracking-widest">
                  {t('auth.account_type')}
                </Label>
                <ToggleGroup
                  type="single"
                  value={accountType}
                  onValueChange={(value) => {
                    if (value === 'user' || value === 'dealer' || value === 'company') {
                      setAccountType(value)
                    }
                  }}
                  className="flex items-stretch justify-center gap-3 w-full"
                >
                  {[
                    { value: 'user', icon: 'mdi:account', label: t('auth.roles.user.title') },
                    { value: 'dealer', icon: 'mdi:store', label: t('auth.roles.dealer.title') },
                    { value: 'company', icon: 'mdi:office-building', label: t('auth.roles.company.title') }
                  ].map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 h-auto rounded-xl border-2 border-muted bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-200 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:shadow-sm"
                    >
                      <Icon icon={item.icon} className="h-6 w-6" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <AnimatePresence mode="popLayout">
                {accountType === 'dealer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-2">
                       <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-md flex items-start gap-2">
                          <Icon icon="mdi:information" className="h-4 w-4 mt-0.5 shrink-0" />
                          <p>{t('auth.register.dealer_info')}</p>
                       </div>
                    </div>
                  </motion.div>
                )}
                
                {accountType === 'company' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="company-name">{t('auth.company_legal_name')}</Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={t('auth.placeholders.company_name')}
                        className="h-11"
                        required={accountType === 'company'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-phone">{t('auth.contact_phone')}</Label>
                      <Input
                        id="company-phone"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder={t('auth.placeholders.phone')}
                        className="h-11"
                        required={accountType === 'company'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Common Fields */}
              <motion.div layout className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.register.name')}</Label>
                  <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.placeholders.name')}
                      className="h-11"
                      required
                  />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.register.email')}</Label>
                  <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.placeholders.email')}
                      className="h-11"
                      required
                  />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.register.password')}</Label>
                  <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                      required
                  />
                  </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2" role="alert">
                      <Icon icon="mdi:alert-circle" className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full h-12 font-medium text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                      <>
                        <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.register.loading')}
                      </>
                  ) : (
                      <>
                        <Icon icon="mdi:account-plus" className="mr-2 h-5 w-5" />
                        {t('auth.register.submit')}
                      </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-8 text-center space-y-4">
              <SocialAuthButtons isLoading={isLoading} mode="register" />
              
              <p className="text-sm text-muted-foreground">
                {t('auth.register.has_account')}{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/90 hover:underline underline-offset-4">
                  {t('auth.register.login_link')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default RegisterPage

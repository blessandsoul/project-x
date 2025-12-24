import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface LocationState {
  from?: {
    pathname: string
  }
}

interface ReactivationData {
  daysRemaining: number
  credentials: {
    identifier: string
    password: string
  }
}

const LoginPage = () => {
  const { t } = useTranslation()
  const { login, reactivateAccount, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | undefined

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showReactivation, setShowReactivation] = useState(false)
  const [reactivationData, setReactivationData] = useState<ReactivationData | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError(t('auth.login.error.required'))
      return
    }

    try {
      await login(email, password)
      // Redirect to origin or default to dashboard/onboarding
      const redirectTo = state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
      // Check if this is a reactivation needed error
      if (err instanceof Error && (err as any).needsReactivation) {
        const reactivationErr = err as Error & {
          needsReactivation: boolean
          daysRemaining: number
          credentials: { identifier: string; password: string }
        }
        setReactivationData({
          daysRemaining: reactivationErr.daysRemaining,
          credentials: reactivationErr.credentials,
        })
        setShowReactivation(true)
        return
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : t('auth.login.error.generic')

      setError(message)
    }
  }

  const handleReactivate = async () => {
    if (!reactivationData) return

    setIsReactivating(true)
    try {
      await reactivateAccount(
        reactivationData.credentials.identifier,
        reactivationData.credentials.password
      )

      setShowReactivation(false)
      toast.success(t('auth.reactivation.success', 'Account reactivated successfully!'))

      // Redirect to dashboard
      const redirectTo = state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('auth.reactivation.error', 'Failed to reactivate account')

      setShowReactivation(false)
      setError(message)
    } finally {
      setIsReactivating(false)
    }
  }

  const handleCancelReactivation = () => {
    setShowReactivation(false)
    setReactivationData(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-lg border-0 sm:border sm:shadow-sm overflow-hidden" role="form" aria-label={t('auth.login.title')}>
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
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.login.title')}</CardTitle>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t('auth.login.subtitle', 'Sign in to access your dashboard.')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
              <motion.div layout className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.login.password')}</Label>
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
                      {t('auth.login.loading')}
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:login" className="mr-2 h-5 w-5" />
                      {t('auth.login.submit')}
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-6">
              <SocialAuthButtons isLoading={isLoading} mode="login" />
            </div>

            <div className="mt-8 text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {t('auth.login.new_here', 'New here?')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('auth.login.no_account')}{' '}
                <Link to="/register" className="font-medium text-primary hover:text-primary/90 hover:underline underline-offset-4">
                  {t('auth.login.register_link')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reactivation Dialog */}
      <AlertDialog open={showReactivation} onOpenChange={setShowReactivation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon icon="mdi:account-reactivate" className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-xl">
                {t('auth.reactivation.title', 'Welcome Back!')}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 text-left">
              <p>
                {t('auth.reactivation.description', 'Your account was scheduled for deletion.')}
              </p>
              {reactivationData && (
                <p className="text-sm font-medium text-foreground">
                  {t('auth.reactivation.days_remaining', {
                    count: reactivationData.daysRemaining,
                    defaultValue: `You have ${reactivationData.daysRemaining} days remaining to reactivate.`
                  })}
                </p>
              )}
              <p className="text-sm">
                {t('auth.reactivation.prompt', 'Would you like to restore your account?')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReactivation} disabled={isReactivating}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={isReactivating}
              className="bg-primary hover:bg-primary/90"
            >
              {isReactivating ? (
                <>
                  <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.reactivation.reactivating', 'Reactivating...')}
                </>
              ) : (
                <>
                  <Icon icon="mdi:account-check" className="mr-2 h-4 w-4" />
                  {t('auth.reactivation.button', 'Reactivate My Account')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LoginPage

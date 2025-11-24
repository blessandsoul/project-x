import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'

interface LocationState {
  from?: {
    pathname: string
  }
}

const LoginPage = () => {
  const { t } = useTranslation()
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | undefined

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    if (!email || !password) {
      setError(t('auth.login.error.required'))
      return
    }

    try {
      await login(email, password)
      // Default to /onboarding for testing flow
      const redirectTo = state?.from?.pathname || '/onboarding'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('auth.login.error.generic')

      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md" role="form" aria-label={t('auth.login.title')}>
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:car" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">{t('auth.login.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('auth.login.subtitle', 'Sign in to save your calculations and favorite companies.')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" aria-live="polite">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isLoading}
              aria-disabled={isLoading}
            >
              <Icon icon="mdi:login" className="me-2 h-4 w-4" />
              {isLoading ? t('auth.login.loading') : t('auth.login.submit')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.login.no_account')}{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              {t('auth.login.register_link')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'

const RegisterPage = () => {
  const { t } = useTranslation()
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    if (!name || !email || !password) {
      setError(t('auth.register.error.required'))
      return
    }

    try {
      await register(name, email, password, 'user')
      navigate('/onboarding/user', { replace: true })
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('auth.register.error.generic')

      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md" role="form" aria-label={t('auth.register.title')}>
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:account-plus" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">{t('auth.register.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.register.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="გიორგი"
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
                placeholder="you@example.com"
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
              <Icon icon="mdi:account-plus" className="me-2 h-4 w-4" />
              {isLoading ? t('auth.register.loading') : t('auth.register.submit')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.register.has_account')}{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              {t('auth.register.login_link')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage

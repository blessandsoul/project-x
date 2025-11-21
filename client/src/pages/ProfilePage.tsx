import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user, isLoading, updateProfile, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email ?? '')
  const [username, setUsername] = useState(user?.name ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    try {
      await updateProfile({
        email: email || undefined,
        username: username || undefined,
        password: password || undefined,
      })

      setPassword('')
      setSuccess(t('profile.success'))
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('profile.error.update')

      setError(message)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.delete_confirm'))) {
      return
    }

    setError('')
    setSuccess('')
    setIsDeleting(true)

    try {
      await deleteAccount()
      navigate('/login', { replace: true })
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t('profile.error.delete')

      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md" aria-label={t('profile.loading')}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center p-6" role="alert" aria-live="polite">
          <CardHeader>
            <CardTitle>{t('profile.not_found')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('profile.login_again')}
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              <Icon icon="mdi:login" className="me-2 h-4 w-4" />
              {t('profile.back_to_login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md" role="form" aria-label={t('profile.edit')}>
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:account-circle" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">{t('profile.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
            <div className="space-y-2">
              <Label htmlFor="username">{t('profile.username')}</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t('profile.username')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('profile.new_password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('profile.password_placeholder')}
              />
            </div>
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
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-disabled={isLoading}
              >
                <Icon icon="mdi:content-save" className="me-2 h-4 w-4" />
                {isLoading ? t('profile.saving') : t('profile.save')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={isDeleting || isLoading}
                aria-disabled={isDeleting || isLoading}
                onClick={handleDeleteAccount}
              >
                <Icon icon="mdi:delete" className="me-2 h-4 w-4" />
                {isDeleting ? t('profile.deleting') : t('profile.delete_account')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage

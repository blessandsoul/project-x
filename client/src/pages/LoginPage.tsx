import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
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
      setError('გთხოვთ შეიყვანოთ ელ-ფოსტა და პაროლი')
      return
    }

    try {
      await login(email, password)
      const redirectTo = state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'ავტორიზაციის დროს მოხდა შეცდომა'

      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md" role="form" aria-label="ავტორიზაცია">
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:car" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">ავტორიზაცია</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
            <div className="space-y-2">
              <Label htmlFor="email">ელ-ფოსტა</Label>
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
              <Label htmlFor="password">პაროლი</Label>
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
              <Icon icon="mdi:login" className="mr-2 h-4 w-4" />
              {isLoading ? 'შესვლა...' : 'შესვლა'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            არ გაქვთ ანგარიში?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              რეგისტრაცია
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

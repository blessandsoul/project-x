import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'

const RegisterPage = () => {
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
      setError('გთხოვთ შეავსოთ ყველა ველი')
      return
    }

    try {
      await register(name, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'რეგისტრაციის დროს მოხდა შეცდომა'

      setError(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md" role="form" aria-label="რეგისტრაცია">
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:account-plus" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">რეგისტრაცია</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
            <div className="space-y-2">
              <Label htmlFor="name">სახელი</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="გიორგი"
                required
              />
            </div>
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
              <Icon icon="mdi:account-plus" className="mr-2 h-4 w-4" />
              {isLoading ? 'რეგისტრაცია...' : 'რეგისტრაცია'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            უკვე გაქვთ ანგარიში?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              შესვლა
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage

 import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useAuth } from '@/hooks/useAuth'

const ProfilePage = () => {
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
      setSuccess('პროფილი წარმატებით განახლდა')
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'პროფილის განახლების დროს მოხდა შეცდომა'

      setError(message)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('დარწმუნებული ხართ, რომ გსურთ ანგარიშის წაშლა?')) {
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
          : 'ანგარიშის წაშლის დროს მოხდა შეცდომა'

      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md" aria-label="პროფილის ჩატვირთვა">
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
            <CardTitle>პროფილი ვერ მოიძებნა</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              გთხოვთ, ხელახლა შეხვიდეთ სისტემაში, რომ ნახოთ თქვენი პროფილი.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              <Icon icon="mdi:login" className="mr-2 h-4 w-4" />
              დაბრუნება ავტორიზაციაზე
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md" role="form" aria-label="პროფილის რედაქტირება">
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:account-circle" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">პროფილი</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isLoading}>
            <div className="space-y-2">
              <Label htmlFor="username">მომხმარებლის სახელი</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="მომხმარებლის სახელი"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ელ-ფოსტა</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">ახალი პაროლი</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
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
                <Icon icon="mdi:content-save" className="mr-2 h-4 w-4" />
                {isLoading ? 'შენახვა...' : 'შენახვა'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={isDeleting || isLoading}
                aria-disabled={isDeleting || isLoading}
                onClick={handleDeleteAccount}
              >
                <Icon icon="mdi:delete" className="mr-2 h-4 w-4" />
                {isDeleting ? 'ანგარიშის წაშლა...' : 'ანგარიშის წაშლა'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage

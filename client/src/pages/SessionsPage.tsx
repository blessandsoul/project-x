import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Icon } from '@iconify/react/dist/iconify.js'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'

interface Session {
  id: string
  user_agent: string | null
  ip: string | null
  created_at: string
  expires_at: string
  is_current: boolean
}

interface SessionsResponse {
  sessions: Session[]
}

function parseUserAgent(ua: string | null): { browser: string; os: string; icon: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', icon: 'mdi:monitor' }

  let browser = 'Unknown'
  let os = 'Unknown'
  let icon = 'mdi:monitor'

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome'
    icon = 'mdi:google-chrome'
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox'
    icon = 'mdi:firefox'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari'
    icon = 'mdi:apple-safari'
  } else if (ua.includes('Edg')) {
    browser = 'Edge'
    icon = 'mdi:microsoft-edge'
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera'
    icon = 'mdi:opera'
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows'
  } else if (ua.includes('Mac OS')) {
    os = 'macOS'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
  } else if (ua.includes('Android')) {
    os = 'Android'
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS'
  }

  return { browser, os, icon }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SessionsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      setError(null)
      const response = await apiClient.get<SessionsResponse>('/auth/sessions')
      setSessions(response.data.sessions)
    } catch (err) {
      console.error('[Sessions] Failed to fetch sessions', err)
      setError(t('sessions.error.fetch', 'Failed to load sessions'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    setRevokingId(sessionId)
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`)
      
      if (isCurrent) {
        // Current session revoked - logout and redirect
        await logout()
        navigate('/login', { replace: true })
      } else {
        // Remove from list
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      }
    } catch (err) {
      console.error('[Sessions] Failed to revoke session', err)
      setError(t('sessions.error.revoke', 'Failed to revoke session'))
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAll = async () => {
    setIsRevokingAll(true)
    try {
      await apiClient.delete('/auth/sessions')
      // All sessions revoked including current - logout and redirect
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('[Sessions] Failed to revoke all sessions', err)
      setError(t('sessions.error.revoke_all', 'Failed to revoke all sessions'))
    } finally {
      setIsRevokingAll(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <Icon icon="mdi:arrow-left" className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('sessions.title', 'Active Sessions')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('sessions.subtitle', 'Manage your active login sessions')}
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isRevokingAll}
                >
                  {isRevokingAll ? (
                    <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon="mdi:logout-variant" className="mr-2 h-4 w-4" />
                  )}
                  {t('sessions.revoke_all', 'Sign out everywhere')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('sessions.revoke_all_title', 'Sign out of all sessions?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('sessions.revoke_all_description', 'This will sign you out of all devices, including this one. You will need to sign in again.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('sessions.confirm_revoke_all', 'Sign out everywhere')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <Icon icon="mdi:alert-circle" className="h-4 w-4 shrink-0" />
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 px-2"
                  onClick={() => setError(null)}
                >
                  <Icon icon="mdi:close" className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sessions List */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Icon icon="mdi:devices" className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">{t('sessions.no_sessions', 'No active sessions found')}</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {sessions.map((session) => {
                const { browser, os, icon } = parseUserAgent(session.user_agent)
                const isRevoking = revokingId === session.id

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                  >
                    <Card className={session.is_current ? 'border-primary/50 bg-primary/5' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Device Icon */}
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${session.is_current ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Icon icon={icon} className="h-5 w-5" />
                          </div>

                          {/* Session Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {browser} on {os}
                              </span>
                              {session.is_current && (
                                <Badge variant="default" className="text-xs">
                                  {t('sessions.current', 'Current')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              {session.ip && (
                                <div className="flex items-center gap-1">
                                  <Icon icon="mdi:ip-network" className="h-3 w-3" />
                                  <span>{session.ip}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:clock-outline" className="h-3 w-3" />
                                <span>{t('sessions.signed_in', 'Signed in')} {formatDate(session.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Revoke Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant={session.is_current ? 'destructive' : 'outline'}
                                size="sm"
                                disabled={isRevoking}
                              >
                                {isRevoking ? (
                                  <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Icon icon="mdi:logout" className="h-4 w-4" />
                                )}
                                <span className="ml-1.5 hidden sm:inline">
                                  {session.is_current ? t('sessions.sign_out', 'Sign out') : t('sessions.revoke', 'Revoke')}
                                </span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {session.is_current
                                    ? t('sessions.sign_out_title', 'Sign out of this session?')
                                    : t('sessions.revoke_title', 'Revoke this session?')}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {session.is_current
                                    ? t('sessions.sign_out_description', 'You will be signed out and redirected to the login page.')
                                    : t('sessions.revoke_description', 'This device will be signed out immediately.')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevokeSession(session.id, session.is_current)}
                                  className={session.is_current ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                                >
                                  {session.is_current ? t('sessions.confirm_sign_out', 'Sign out') : t('sessions.confirm_revoke', 'Revoke')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Icon icon="mdi:information-outline" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{t('sessions.info_title', 'About sessions')}</p>
                <p>{t('sessions.info_description', 'Sessions are created when you sign in. If you see a session you don\'t recognize, revoke it immediately and change your password.')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default SessionsPage

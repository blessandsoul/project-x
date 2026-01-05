/**
 * Profile Page
 *
 * User account management page with 4 distinct sections:
 * 1. Profile Avatar - Upload, update, delete avatar
 * 2. Account Information - Update email and username
 * 3. Change Password - Secure password update with strength indicator
 * 4. Delete Account - Permanent account deactivation with confirmation
 *
 * Uses React Hook Form + Zod for validation, shadcn components for UI.
 * All API calls use the project's standard apiClient with CSRF protection.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Icon } from '@iconify/react/dist/iconify.js'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
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

import { useAuth } from '@/hooks/useAuth'
import { apiClient, apiAuthorizedMutation } from '@/lib/apiClient'

// =============================================================================
// Validation Schemas
// =============================================================================

// Account Info validation schema
const accountInfoSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Please enter a valid email address').max(255),
})

type AccountInfoFormValues = z.infer<typeof accountInfoSchema>

// Password change validation schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(255)
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

// Delete account validation schema
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete your account'),
  reason: z.string().max(500).optional(),
})

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>

// =============================================================================
// Avatar File Validation
// =============================================================================

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPEG, PNG, or WebP image' }
  }
  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return { valid: false, error: 'Image must be smaller than 5MB' }
  }
  return { valid: true }
}

// =============================================================================
// Password Strength Calculator
// =============================================================================

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

function calculatePasswordStrength(password: string): {
  strength: PasswordStrength
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 10) score += 1
  if (password.length >= 14) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 2) {
    return { strength: 'weak', score: 25, label: 'Weak', color: 'bg-red-500' }
  }
  if (score <= 3) {
    return { strength: 'fair', score: 50, label: 'Fair', color: 'bg-orange-500' }
  }
  if (score <= 4) {
    return { strength: 'good', score: 75, label: 'Good', color: 'bg-yellow-500' }
  }
  return { strength: 'strong', score: 100, label: 'Strong', color: 'bg-green-500' }
}

// =============================================================================
// Main Component
// =============================================================================

const ProfilePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isLoading: authLoading, refreshProfile, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------------
  // Avatar State
  // ---------------------------------------------------------------------------
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)

  // ---------------------------------------------------------------------------
  // Account Info Form
  // ---------------------------------------------------------------------------
  const accountInfoForm = useForm<AccountInfoFormValues>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  })
  const [isUpdatingAccountInfo, setIsUpdatingAccountInfo] = useState(false)

  // ---------------------------------------------------------------------------
  // Change Password Form
  // ---------------------------------------------------------------------------
  const changePasswordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const watchedNewPassword = changePasswordForm.watch('newPassword')
  const passwordStrength = watchedNewPassword
    ? calculatePasswordStrength(watchedNewPassword)
    : null

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ---------------------------------------------------------------------------
  // Delete Account Form
  // ---------------------------------------------------------------------------
  const deleteAccountForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      reason: '',
    },
  })
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Fetch avatar on mount
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await apiClient.get<{
          avatarUrl: string | null
          originalAvatarUrl: string | null
        }>('/user/avatar')
        setAvatarUrl(response.data.avatarUrl)
      } catch (error) {
        console.error('[Profile] Failed to fetch avatar:', error)
      } finally {
        setIsLoadingAvatar(false)
      }
    }

    if (user) {
      fetchAvatar()
    } else {
      setIsLoadingAvatar(false)
    }
  }, [user])

  // Populate account info form when user loads
  useEffect(() => {
    if (user) {
      accountInfoForm.reset({
        username: user.username || user.name || '',
        email: user.email || '',
      })
    }
  }, [user, accountInfoForm])

  // ---------------------------------------------------------------------------
  // Avatar Handlers
  // ---------------------------------------------------------------------------

  const handleAvatarSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validation = validateAvatarFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        e.target.value = ''
        return
      }

      setAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    },
    []
  )

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile) return

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await apiClient.post<{
        avatarUrl: string | null
        originalAvatarUrl: string | null
      }>('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setAvatarUrl(response.data.avatarUrl)
      setAvatarPreview(null)
      setAvatarFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh profile to update header avatar
      await refreshProfile()

      toast.success(t('profile.avatar.upload_success', 'Profile photo uploaded successfully'))
    } catch (error: any) {
      console.error('[Profile] Avatar upload failed:', error)
      const message = error.response?.data?.message || t('profile.avatar.upload_error', 'Failed to upload avatar')
      toast.error(message)
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [avatarFile, refreshProfile, t])

  const handleAvatarDelete = useCallback(async () => {
    setIsDeletingAvatar(true)

    try {
      await apiClient.delete('/user/avatar')
      setAvatarUrl(null)
      setAvatarPreview(null)
      setAvatarFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh profile to update header avatar
      await refreshProfile()

      toast.success(t('profile.avatar.delete_success', 'Profile photo removed successfully'))
    } catch (error: any) {
      console.error('[Profile] Avatar delete failed:', error)
      const message = error.response?.data?.message || t('profile.avatar.delete_error', 'Failed to delete avatar')
      toast.error(message)
    } finally {
      setIsDeletingAvatar(false)
    }
  }, [refreshProfile, t])

  const handleCancelAvatarPreview = useCallback(() => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Account Info Handler
  // ---------------------------------------------------------------------------

  const onSubmitAccountInfo = useCallback(
    async (data: AccountInfoFormValues) => {
      setIsUpdatingAccountInfo(true)

      try {
        await apiAuthorizedMutation<{ user: any }>('PATCH', '/account', {
          email: data.email,
          username: data.username,
        })

        await refreshProfile()
        toast.success(t('profile.account.update_success', 'Account information updated'))
      } catch (error: any) {
        console.error('[Profile] Account update failed:', error)
        const message =
          error.response?.data?.message ||
          t('profile.account.update_error', 'Failed to update account information')
        toast.error(message)
      } finally {
        setIsUpdatingAccountInfo(false)
      }
    },
    [refreshProfile, t]
  )

  // ---------------------------------------------------------------------------
  // Change Password Handler
  // ---------------------------------------------------------------------------

  const onSubmitChangePassword = useCallback(
    async (data: ChangePasswordFormValues) => {
      setIsChangingPassword(true)

      try {
        await apiAuthorizedMutation<{ success: boolean }>('POST', '/account/change-password', {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })

        changePasswordForm.reset()
        toast.success(
          t(
            'profile.password.change_success',
            'Password changed successfully. You will be logged out of other devices.'
          )
        )
      } catch (error: any) {
        console.error('[Profile] Password change failed:', error)
        const message =
          error.response?.data?.message ||
          t('profile.password.change_error', 'Failed to change password')
        toast.error(message)
      } finally {
        setIsChangingPassword(false)
      }
    },
    [changePasswordForm, t]
  )

  // ---------------------------------------------------------------------------
  // Delete Account Handler
  // ---------------------------------------------------------------------------

  const onSubmitDeleteAccount = useCallback(
    async (data: DeleteAccountFormValues) => {
      setIsDeletingAccount(true)

      try {
        await apiAuthorizedMutation<{ success: boolean }>('POST', '/account/deactivate', {
          password: data.password,
          reason: data.reason || undefined,
        })

        toast.success(
          t('profile.delete.success', 'Account deactivated successfully. Redirecting...')
        )

        // Logout to clear user state immediately
        await logout()

        // Redirect to home page
        navigate('/', { replace: true })
      } catch (error: any) {
        console.error('[Profile] Account deactivation failed:', error)
        const message =
          error.response?.data?.message ||
          t('profile.delete.error', 'Failed to deactivate account')
        toast.error(message)
        setShowDeleteDialog(false)
      } finally {
        setIsDeletingAccount(false)
      }
    },
    [logout, navigate, t]
  )

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center p-6" role="alert" aria-live="polite">
          <CardHeader>
            <CardTitle>{t('profile.not_found', 'User not found')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('profile.login_again', 'Please log in to access your profile')}
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              <Icon icon="mdi:login" className="me-2 h-4 w-4" />
              {t('profile.back_to_login', 'Back to Login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label={t('common.back', 'Go back')}
          >
            <Icon icon="mdi:arrow-left" className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('profile.title', 'Profile Settings')}
            </h1>
          </div>
        </div>

        {/* Responsive Grid Layout:
            - Mobile (<768px): Single column, vertical stack
            - Tablet (768px-1024px): 2-column grid, 2 sections per row
            - Desktop (≥1024px): 2-column layout with sticky left sidebar
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[380px_1fr] gap-6 gap-y-6 lg:gap-8">
          {/* Profile Photo Section */}
          <div className="lg:sticky lg:top-28 lg:self-start lg:z-20">
            {/* =================================================================== */}
            {/* Section 1: Profile Avatar */}
            {/* =================================================================== */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:account-circle" className="h-5 w-5" />
                  {t('profile.avatar.title', 'Profile Photo')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'profile.avatar.description',
                    'Upload a profile picture. Max 5MB, JPEG/PNG/WebP.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Display - Centered and Larger */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {isLoadingAvatar ? (
                      <Skeleton className="h-32 w-32 rounded-full" />
                    ) : (
                      <Avatar className="h-32 w-32 ring-4 ring-background shadow-lg">
                        <AvatarImage
                          src={avatarPreview || avatarUrl || undefined}
                          alt={user.username || 'Profile'}
                        />
                        <AvatarFallback className="text-4xl font-semibold">
                          {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {avatarPreview && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                          <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{user.username || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Avatar Actions */}
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />

                  {avatarPreview ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="w-full"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                            {t('profile.avatar.uploading', 'Uploading...')}
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:check" className="me-2 h-4 w-4" />
                            {t('profile.avatar.save', 'Save Photo')}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelAvatarPreview}
                        disabled={isUploadingAvatar}
                        className="w-full"
                      >
                        <Icon icon="mdi:close" className="me-2 h-4 w-4" />
                        {t('common.cancel', 'Cancel')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar || isDeletingAvatar}
                        className="w-full"
                      >
                        <Icon icon="mdi:upload" className="me-2 h-4 w-4" />
                        {t('profile.avatar.upload', 'Upload Photo')}
                      </Button>
                      {avatarUrl && (
                        <Button
                          variant="outline"
                          onClick={handleAvatarDelete}
                          disabled={isDeletingAvatar || isUploadingAvatar}
                          className="w-full text-destructive hover:text-destructive"
                        >
                          {isDeletingAvatar ? (
                            <>
                              <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                              {t('profile.avatar.deleting', 'Deleting...')}
                            </>
                          ) : (
                            <>
                              <Icon icon="mdi:delete" className="me-2 h-4 w-4" />
                              {t('profile.avatar.delete', 'Remove')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    {t(
                      'profile.avatar.hint',
                      'Recommended: Square image, at least 200x200 pixels'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Settings Sections - Grouped on desktop, individual grid items on tablet */}
          <div className="space-y-6 md:space-y-0 md:contents lg:block lg:space-y-6">
            {/* =================================================================== */}
            {/* Section 2: Account Information */}
            {/* =================================================================== */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:account-edit" className="h-5 w-5" />
                  {t('profile.account.title', 'Account Information')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'profile.account.description',
                    'Update your username and email address'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...accountInfoForm}>
                  <form
                    onSubmit={accountInfoForm.handleSubmit(onSubmitAccountInfo)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={accountInfoForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.username', 'Username')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('profile.username_placeholder', 'Enter username')}
                                {...field}
                                disabled={isUpdatingAccountInfo}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {t(
                                'profile.username_hint',
                                '3-50 characters. Letters, numbers, underscores, hyphens only.'
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.email', 'Email')}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t('profile.email_placeholder', 'Enter email')}
                                {...field}
                                disabled={isUpdatingAccountInfo}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isUpdatingAccountInfo}>
                      {isUpdatingAccountInfo ? (
                        <>
                          <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                          {t('profile.saving', 'Saving...')}
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:content-save" className="me-2 h-4 w-4" />
                          {t('profile.save_changes', 'Save Changes')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* =================================================================== */}
            {/* Section 3: Change Password */}
            {/* =================================================================== */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:lock-reset" className="h-5 w-5" />
                  {t('profile.password.title', 'Change Password')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'profile.password.description',
                    'Update your password. You will be logged out of other devices.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...changePasswordForm}>
                  <form
                    onSubmit={changePasswordForm.handleSubmit(onSubmitChangePassword)}
                    className="space-y-4"
                  >
                    <FormField
                      control={changePasswordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('profile.password.current', 'Current Password')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder="••••••••••"
                                {...field}
                                disabled={isChangingPassword}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                              >
                                <Icon
                                  icon={showCurrentPassword ? 'mdi:eye-off' : 'mdi:eye'}
                                  className="h-4 w-4"
                                />
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={changePasswordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('profile.password.new', 'New Password')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="••••••••••"
                                {...field}
                                disabled={isChangingPassword}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                              >
                                <Icon
                                  icon={showNewPassword ? 'mdi:eye-off' : 'mdi:eye'}
                                  className="h-4 w-4"
                                />
                              </button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            {t(
                              'profile.password.requirements',
                              'Min 10 characters with uppercase, lowercase, and number'
                            )}
                          </FormDescription>
                          {/* Password Strength Indicator */}
                          {passwordStrength && (
                            <div className="space-y-1.5 mt-2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                    style={{ width: `${passwordStrength.score}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground min-w-[60px] text-right">
                                  {passwordStrength.label}
                                </span>
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={changePasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('profile.password.confirm', 'Confirm New Password')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••••"
                                {...field}
                                disabled={isChangingPassword}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                              >
                                <Icon
                                  icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'}
                                  className="h-4 w-4"
                                />
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                          {t('profile.password.changing', 'Changing...')}
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:lock-check" className="me-2 h-4 w-4" />
                          {t('profile.password.change', 'Update Password')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* =================================================================== */}
            {/* Section 4: Delete Account */}
            {/* =================================================================== */}
            <Card className="border-destructive/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Icon icon="mdi:account-remove" className="h-5 w-5" />
                  {t('profile.delete.title', 'Deactivate Account')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'profile.delete.description',
                    'Deactivate your account temporarily. You have 30 days to reactivate by logging in, after which your account and data will be permanently deleted.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <Icon
                      icon="mdi:alert-circle"
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">
                        {t('profile.delete.warning_title', 'Important: 30-Day Grace Period')}
                      </p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        <li>
                          • {t('profile.delete.warning_1', 'Your account will be deactivated immediately')}
                        </li>
                        <li>
                          • {t('profile.delete.warning_2', 'You have 30 days to reactivate by logging in')}
                        </li>
                        <li>
                          • {t('profile.delete.warning_3', 'After 30 days, all data will be permanently deleted')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Form {...deleteAccountForm}>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeletingAccount}
                      >
                        <Icon icon="mdi:account-off" className="me-2 h-4 w-4" />
                        {t('profile.delete.button', 'Deactivate My Account')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('profile.delete.dialog_title', 'Deactivate your account?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'profile.delete.dialog_description',
                            'Your account will be deactivated immediately. You can reactivate it within 30 days by logging in. After 30 days, your account and all data will be permanently deleted.'
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      {/* Form fields inside dialog */}
                      <div className="space-y-4 py-4">
                        <FormField
                          control={deleteAccountForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-destructive">
                                {t('profile.delete.password_label', 'Confirm with your password')} *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="••••••••••"
                                  {...field}
                                  disabled={isDeletingAccount}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={deleteAccountForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('profile.delete.reason_label', 'Reason for leaving (optional)')}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t(
                                    'profile.delete.reason_placeholder',
                                    'Let us know why you are leaving...'
                                  )}
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                  disabled={isDeletingAccount}
                                />
                              </FormControl>
                              <FormDescription>
                                {t(
                                  'profile.delete.reason_hint',
                                  'Your feedback helps us improve our service'
                                )}
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingAccount}>
                          {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async (e) => {
                            e.preventDefault()
                            // Validate and submit
                            const valid = await deleteAccountForm.trigger()
                            if (valid) {
                              const formValues = deleteAccountForm.getValues()
                              await onSubmitDeleteAccount(formValues)
                            }
                          }}
                          disabled={isDeletingAccount}
                        >
                          {isDeletingAccount ? (
                            <>
                              <Icon icon="mdi:loading" className="me-2 h-4 w-4 animate-spin" />
                              {t('profile.delete.deleting', 'Deactivating...')}
                            </>
                          ) : (
                            <>
                              <Icon icon="mdi:account-off" className="me-2 h-4 w-4" />
                              {t('profile.delete.confirm', 'Yes, Deactivate My Account')}
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div >
  )
}

export default ProfilePage

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'

interface SocialAuthButtonsProps {
  isLoading?: boolean
  mode?: 'login' | 'register'
}

export const SocialAuthButtons = ({ isLoading = false, mode = 'login' }: SocialAuthButtonsProps) => {
  const { t } = useTranslation()

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider} in ${mode} mode...`)
    // TODO-FX: Implement social login logic
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {t('auth.social.continue_with', 'Or continue with')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin('google')}
          className="w-full"
        >
          <Icon icon="logos:google-icon" className="mr-2 h-4 w-4" />
          {t('auth.social.google', 'Google')}
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin('facebook')}
          className="w-full"
        >
          <Icon icon="logos:facebook" className="mr-2 h-4 w-4" />
          {t('auth.social.facebook', 'Facebook')}
        </Button>
      </div>
    </div>
  )
}

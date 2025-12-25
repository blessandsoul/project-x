import { Icon } from '@iconify/react'

export type SocialPlatform = 'facebook' | 'instagram'

export interface SocialLink {
    platform: SocialPlatform
    url: string
    icon: string
    label: string
}

export const SOCIAL_ICONS: Record<SocialPlatform, { icon: string; label: string }> = {
    facebook: {
        icon: 'mdi:facebook',
        label: 'Facebook',
    },
    instagram: {
        icon: 'mdi:instagram',
        label: 'Instagram',
    },
}

interface SocialIconLinkProps {
    platform: SocialPlatform
    url: string
    className?: string
}

export const SocialIconLink = ({ platform, url, className = '' }: SocialIconLinkProps) => {
    const socialInfo = SOCIAL_ICONS[platform]

    if (!socialInfo) return null

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={socialInfo.label}
            aria-label={socialInfo.label}
            className={`p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ${className}`}
        >
            <Icon icon={socialInfo.icon} className="h-5 w-5 text-slate-600" />
        </a>
    )
}

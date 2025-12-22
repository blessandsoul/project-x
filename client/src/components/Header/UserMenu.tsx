import type { FC } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
// import { useInquiryDrawer } from '@/contexts/InquiryDrawerContext'; // Disabled - inquiry system not ready

interface UserMenuUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface UserMenuProps {
  user: UserMenuUser;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
}


type NavItem = {
  id: string;
  icon: string;
  labelKey: string;
  href?: string;
  action?: 'openMessages';
};

const userMenuNavigationItems: NavItem[] = [
  { id: 'dashboard', icon: 'mdi:view-dashboard-outline', labelKey: 'navigation.dashboard', href: '/dashboard' },
  { id: 'favorite-vehicles', icon: 'mdi:star-outline', labelKey: 'navigation.favorite_vehicles', href: '/favorite-vehicles' },
  // { id: 'messages', icon: 'mdi:message-text-outline', labelKey: 'header.messages', action: 'openMessages' }, // Disabled - inquiry system not ready
];

const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}`.toUpperCase();
};

const UserMenu: FC<UserMenuProps> = ({ user, onLogout, theme = 'light' }) => {
  const { t } = useTranslation();
  const { companyId, userRole } = useAuth();
  // const { openDrawer } = useInquiryDrawer(); // Disabled - inquiry system not ready
  const initials = getInitials(user.name);
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label={t('header.open_profile_menu')}>
        <Button
          variant="ghost"
          size="sm"
          className={
            theme === 'dark'
              ? 'flex items-center gap-2 px-2 py-1 text-white hover:text-white hover:bg-white/10 transition-colors data-[state=open]:bg-white/10 data-[state=open]:shadow-sm'
              : 'flex items-center gap-2 px-2 py-1 hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:shadow-sm'
          }
        >
          <Avatar className="h-7 w-7 rounded-full">
            <AvatarImage src={user.avatar} alt={t('header.avatar_alt')} />
            <AvatarFallback className="rounded-full text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'hidden max-w-[120px] truncate text-xs font-medium md:inline-block',
              theme === 'dark' ? 'text-white' : 'text-current'
            )}
          >
            {user.name}
          </span>
          <Icon
            icon="mdi:chevron-down"
            className={
              theme === 'dark'
                ? 'h-4 w-4 text-white/80 transition-transform duration-200 data-[state=open]:rotate-180'
                : 'h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180'
            }
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={6}
        collisionPadding={8}
        className="w-56 max-w-[calc(100vw-1rem)] overflow-hidden"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMenuNavigationItems.map(item => (
          <DropdownMenuItem
            key={item.id}
            onSelect={event => {
              event.preventDefault();
              // Disabled - inquiry system not ready
              // if (item.action === 'openMessages') {
              //   openDrawer();
              // } else if (item.href) {
              if (item.href) {
                navigate(item.href);
              }
            }}
          >
            <Icon icon={item.icon} className="me-2 h-4 w-4" />
            <span>{t(item.labelKey)}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={event => {
            event.preventDefault();
            navigate('/profile');
          }}
        >
          <Icon icon="mdi:account-circle" className="me-2 h-4 w-4" />
          <span>{t('header.profile')}</span>
        </DropdownMenuItem>
        {userRole === 'company' && companyId && (
          <DropdownMenuItem
            onSelect={event => {
              event.preventDefault();
              navigate('/company/settings');
            }}
          >
            <Icon icon="mdi:domain" className="me-2 h-4 w-4" />
            <span>{t('header.company_settings')}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async event => {
            event.preventDefault();
            if (onLogout) {
              await onLogout();
            }
            navigate('/');
          }}
        >
          <Icon icon="mdi:logout" className="me-2 h-4 w-4" />
          <span>{t('header.sign_out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

UserMenu.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
  }).isRequired,
  onLogout: PropTypes.func,
};
export default UserMenu;

import type { FC } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface UserMenuUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface UserMenuProps {
  user: UserMenuUser;
  onLogout?: () => void;
}

// TODO-FX: Connect to i18n library.
const t = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const userMenuNavigationItems = [
  { id: 'dashboard', icon: 'mdi:view-dashboard-outline', labelKey: 'header.dashboard', href: '/dashboard' },
  { id: 'catalog', icon: 'mdi:view-grid-outline', labelKey: 'header.catalog', href: '/catalog' },
];

const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}`.toUpperCase();
};

const UserMenu: FC<UserMenuProps> = ({ user, onLogout }) => {
  const initials = getInitials(user.name);
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label={t('header.open_profile_menu')}>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2 py-1 hover:bg-muted"
        >
          <Avatar className="h-7 w-7 rounded-full">
            <AvatarImage src={user.avatar} alt={t('header.avatar_alt')} />
            <AvatarFallback className="rounded-full text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-xs font-medium md:inline-block">
            {user.name}
          </span>
          <Icon icon="mdi:chevron-down" className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
              navigate(item.href);
            }}
          >
            <Icon icon={item.icon} className="mr-2 h-4 w-4" />
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
          <Icon icon="mdi:account-circle" className="mr-2 h-4 w-4" />
          <span>{t('header.profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={event => {
            event.preventDefault();
            if (onLogout) {
              onLogout();
            }
          }}
        >
          <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
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

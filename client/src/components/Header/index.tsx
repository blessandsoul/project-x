import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import AuthDrawer from '@/components/AuthDrawer';
import UserMenu from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
}

interface HeaderProps {
  user?: User | null;
  navigationItems: NavigationItem[];
  isSticky?: boolean;
}

const STORAGE_KEY_USER = 'projectx_auth_user';

const Header: React.FC<HeaderProps> = ({ user, navigationItems, isSticky = true }) => {
  const { t } = useTranslation();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  let storedUser: User | null = null;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_USER);
      if (raw) {
        storedUser = JSON.parse(raw) as User;
      }
    } catch {
      storedUser = null;
    }
  }

  const effectiveUser = authUser ?? storedUser ?? (isAuthenticated ? authUser : user ?? null);

  return (
    <header
      className={`${isSticky ? 'sticky top-0 ' : ''}z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
      role="banner"
    >
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 flex h-14 items-center">
        <div className="me-4 hidden md:flex">
          <Link to="/" className="me-6 flex items-center space-x-2">
            <Icon icon="mdi:home" className="h-6 w-6" />
            <span className="hidden sm:inline-block font-logo-bebas text-xl tracking-wide">
              <span className="font-bold">Trusted</span>{' '}
              <span className="font-normal">Importers.Ge</span>
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item: NavigationItem) => (
              <NavLink
                key={item.id}
                to={item.href}
                className={({ isActive }) =>
                  isActive
                    ? 'transition-colors text-primary'
                    : 'transition-colors text-foreground/60 hover:text-foreground/80'
                }
              >
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="md:hidden"
                  size="icon"
                  aria-label={t('header.menu')}
                >
                  <Icon icon="mdi:menu" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col gap-4 p-4 md:hidden">
                <SheetHeader>
                  <SheetTitle>
                    <span className="font-logo-bebas text-2xl tracking-wide">
                      <span className="font-bold">Trusted</span>{' '}
                      <span className="font-normal">Importers.Ge</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-3">
                  {navigationItems.map((item: NavigationItem) => (
                    <SheetClose asChild key={item.id}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          isActive
                            ? 'flex items-center rounded-md px-2 py-1.5 text-base font-semibold text-primary bg-primary/5'
                            : 'flex items-center rounded-md px-2 py-1.5 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted'
                        }
                      >
                        {t(item.label)}
                      </NavLink>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            
            {effectiveUser ? (
              <UserMenu user={effectiveUser} onLogout={logout} />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAuthOpen(true)}
                aria-label={t('header.sign_in')}
              >
                <Icon icon="mdi:login" className="me-2 h-4 w-4" />
                {t('header.sign_in')}
              </Button>
            )}
          </nav>
        </div>
      </div>
      <AuthDrawer open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </header>
  );
};

Header.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
  }),
  navigationItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ).isRequired,
  isSticky: PropTypes.bool,
};

export default Header;

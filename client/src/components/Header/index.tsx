import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from '@/lib/utils';

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
  const [isHidden, setIsHidden] = useState(false);

  let storedUser: User | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_USER);
      if (raw) storedUser = JSON.parse(raw) as User;
    } catch { storedUser = null; }
  }

  const effectiveUser = authUser ?? storedUser ?? (isAuthenticated ? authUser : user ?? null);

  const effectiveMenuUser = effectiveUser
    ? {
        id: String(effectiveUser.id),
        name: effectiveUser.name ?? effectiveUser.email,
        email: effectiveUser.email,
        avatar: effectiveUser.avatar ?? '',
      }
    : null;

  useEffect(() => {
    let lastScrollY = window.scrollY || 0;

    const handleScroll = () => {
      const isDesktop = window.innerWidth >= 768;

      if (isDesktop) {
        if (isHidden) {
          setIsHidden(false);
        }
        lastScrollY = window.scrollY || 0;
        return;
      }

      const currentY = window.scrollY || 0;
      const delta = currentY - lastScrollY;

      if (Math.abs(delta) < 4) {
        lastScrollY = currentY;
        return;
      }

      if (currentY > 64 && delta > 0) {
        setIsHidden(true);
      } else if (delta < 0) {
        setIsHidden(false);
      }

      lastScrollY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHidden]);

  return (
    <header
      className={cn(
        'z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transform transition-transform duration-200 ease-out will-change-transform',
        isSticky && 'sticky top-0',
        isHidden ? '-translate-y-full' : 'translate-y-0'
      )}
      role="banner"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Icon icon="mdi:shield-check" className="h-6 w-6" />
          </div>
          <span className="hidden sm:inline-block font-sans text-xl font-bold tracking-tight text-slate-900">
            Trusted<span className="font-medium text-slate-600">Importers</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {navigationItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'transition-colors hover:text-foreground',
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                )
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
           <div className="hidden md:block">
              <LanguageSwitcher />
           </div>

           {effectiveMenuUser ? (
              <UserMenu user={effectiveMenuUser} onLogout={logout} />
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Link to="/login">{t('header.sign_in')}</Link>
              </Button>
            )}
            
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Icon icon="mdi:menu" className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[340px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-bold">{t('header.menu')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <nav className="flex flex-col space-y-1">
                    {navigationItems.map((item) => (
                      <SheetClose asChild key={item.id}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            cn(
                              'px-4 py-3 rounded-md text-sm font-medium transition-colors',
                              isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700',
                            )
                          }
                        >
                          {t(item.label)}
                        </NavLink>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <LanguageSwitcher />
                    {!effectiveMenuUser && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/login">{t('header.sign_in')}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
        </div>
      </div>
      
      {/* Mobile-only bottom border for separation */}
      <div className="h-px bg-slate-100 lg:hidden" />
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

import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import UserMenu from './UserMenu';
import LanguageSwitcher, { LANGUAGES } from './LanguageSwitcher';
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
  const { t, i18n } = useTranslation();
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

  const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.split(' ').filter(Boolean);
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    return `${first}${second}`.toUpperCase();
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('i18nextLng', langCode);
    } catch (e) {
      console.error('Failed to save language preference', e);
    }
  };

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
              <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
                {/* Header with Branding */}
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-left flex items-center gap-2">
                     <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
                        <Icon icon="mdi:shield-check" className="h-5 w-5" />
                      </div>
                      <span className="font-sans text-lg font-bold tracking-tight text-slate-900">
                        Trusted<span className="font-medium text-slate-600">Importers</span>
                      </span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-col py-6 px-4 gap-6">
                    
                    {/* User Info Section */}
                    {effectiveMenuUser ? (
                      <div className="flex flex-col gap-4">
                         <div className="flex items-center gap-3 px-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={effectiveMenuUser.avatar} alt={effectiveMenuUser.name} />
                              <AvatarFallback>{getInitials(effectiveMenuUser.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-medium truncate text-sm">{effectiveMenuUser.name}</span>
                              <span className="text-xs text-muted-foreground truncate">{effectiveMenuUser.email}</span>
                            </div>
                         </div>
                         <div className="grid gap-1">
                            <SheetClose asChild>
                              <Link 
                                to="/dashboard" 
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                              >
                                <Icon icon="mdi:view-dashboard-outline" className="h-5 w-5 text-slate-500" />
                                {t('navigation.dashboard')}
                              </Link>
                            </SheetClose>
                             <SheetClose asChild>
                              <Link 
                                to="/catalog" 
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                              >
                                <Icon icon="mdi:view-grid-outline" className="h-5 w-5 text-slate-500" />
                                {t('navigation.catalog')}
                              </Link>
                            </SheetClose>
                             <SheetClose asChild>
                              <Link 
                                to="/profile" 
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                              >
                                <Icon icon="mdi:account-circle-outline" className="h-5 w-5 text-slate-500" />
                                {t('header.profile')}
                              </Link>
                            </SheetClose>
                         </div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <SheetClose asChild>
                          <Button asChild className="w-full justify-start" size="lg">
                            <Link to="/login">
                              <Icon icon="mdi:login" className="mr-2 h-5 w-5" />
                              {t('header.sign_in')}
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                           <Button asChild variant="outline" className="w-full justify-start" size="lg">
                              <Link to="/register">
                                <Icon icon="mdi:account-plus" className="mr-2 h-5 w-5" />
                                {t('header.register') || 'Register'}
                              </Link>
                           </Button>
                        </SheetClose>
                      </div>
                    )}

                    <Separator />

                    {/* Main Navigation */}
                    <nav className="flex flex-col gap-1">
                      <h4 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('header.menu')}
                      </h4>
                      {navigationItems.map((item) => (
                        <SheetClose asChild key={item.id}>
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                                isActive 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              )
                            }
                          >
                            {t(item.label)}
                          </NavLink>
                        </SheetClose>
                      ))}
                    </nav>

                    <Separator />

                    {/* Language Selector */}
                    <div className="space-y-3">
                       <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                         {t('header.language')}
                       </h4>
                       <div className="grid grid-cols-2 gap-2">
                          {LANGUAGES.map((lang) => (
                            <Button
                              key={lang.code}
                              variant={i18n.language === lang.code ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "w-full justify-start h-9",
                                i18n.language === lang.code && "bg-primary text-primary-foreground"
                              )}
                              onClick={() => handleLanguageChange(lang.code)}
                            >
                              <Icon 
                                icon={lang.icon} 
                                className="mr-2 h-4 w-4 rounded-full object-cover" 
                              />
                              <span className="truncate">{lang.label}</span>
                            </Button>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
                
                {/* Logout Footer */}
                {effectiveMenuUser && (
                  <div className="p-4 border-t bg-slate-50 mt-auto">
                    <SheetClose asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (logout) logout();
                        }}
                      >
                        <Icon icon="mdi:logout" className="mr-2 h-5 w-5" />
                        {t('header.sign_out')}
                      </Button>
                    </SheetClose>
                  </div>
                )}
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

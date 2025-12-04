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
  variant?: 'hero' | 'glass';
}

const STORAGE_KEY_USER = 'projectx_auth_user';

const Header: React.FC<HeaderProps> = ({ user, navigationItems, isSticky = true, variant = 'glass' }) => {
  const { t, i18n } = useTranslation();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [isHidden, setIsHidden] = useState(false);
  const isHeroVariant = variant === 'hero';

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
        'fixed top-0 z-40 w-full backdrop-blur-2xl transition-all transform duration-200 ease-out will-change-transform',
        isHeroVariant
          ? 'border-white/10 bg-slate-900/30 text-white shadow-[0_25px_60px_rgba(15,23,42,0.45)]'
          : 'border-white/30 bg-white/35 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.12)]',
        isSticky && '',
        isHidden ? '-translate-y-full' : 'translate-y-0'
      )}
      role="banner"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Icon icon="mdi:shield-check" className="h-6 w-6" />
          </div>
          <span
            className={cn('inline-block font-sans text-xl font-bold tracking-tight', isHeroVariant ? 'text-white' : 'text-slate-900')}
          >
            Trusted
            <span className={cn('font-medium', isHeroVariant ? 'text-white/80' : 'text-slate-600')}>
              Importers
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className={cn(
            'hidden md:flex items-center gap-6 text-sm font-medium',
            isHeroVariant ? 'text-white/80' : 'text-slate-600'
          )}
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'transition-colors',
                  isHeroVariant ? 'hover:text-white' : 'hover:text-slate-900',
                  isActive
                    ? isHeroVariant
                      ? 'text-white font-semibold drop-shadow'
                      : 'text-slate-900 font-semibold'
                    : isHeroVariant
                      ? 'text-white/70'
                      : 'text-slate-500'
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
              <div className="hidden md:block">
                <UserMenu user={effectiveMenuUser} onLogout={logout} />
              </div>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  'hidden sm:flex border rounded-full px-4 transition-colors',
                  isHeroVariant
                    ? 'bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white'
                    : 'bg-white/80 text-slate-900 border-white/70 hover:bg-white'
                )}
              >
                <Link to="/login">{t('header.sign_in')}</Link>
              </Button>
            )}
            
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'lg:hidden border border-transparent',
                    isHeroVariant ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Icon icon="mdi:menu" className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-white">
                {/* Header with Branding */}
                <SheetHeader className="px-3 py-3 border-b">
                  <SheetTitle className="text-left flex items-center gap-1.5 text-sm">
                     <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                        <Icon icon="mdi:shield-check" className="h-4 w-4" />
                      </div>
                      <span className="font-sans text-base font-semibold tracking-tight text-slate-900">
                        Trusted<span className="font-medium text-slate-600">Importers</span>
                      </span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-col py-3 px-3 gap-3">
                    
                    {/* User Info Section */}
                    {effectiveMenuUser ? (
                      <div className="flex flex-col gap-2.5">
                         <div className="flex items-center gap-2.5 px-1.5">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={effectiveMenuUser.avatar} alt={effectiveMenuUser.name} />
                              <AvatarFallback>{getInitials(effectiveMenuUser.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-medium truncate text-sm leading-tight">{effectiveMenuUser.name}</span>
                              <span className="text-[11px] text-muted-foreground truncate leading-tight">{effectiveMenuUser.email}</span>
                           </div>
                         </div>
                         <div className="grid gap-1">
                            <SheetClose asChild>
                              <Link 
                                to="/dashboard" 
                                className="flex items-center gap-2 px-2 py-1 text-sm font-medium rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                              >
                                <Icon icon="mdi:view-dashboard-outline" className="h-4 w-4 text-slate-500" />
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
                                to="/favorite-vehicles" 
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                              >
                                <Icon icon="mdi:star-outline" className="h-5 w-5 text-slate-500" />
                                {t('navigation.favorite_vehicles')}
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
                      <div className="grid gap-1">
                        <SheetClose asChild>
                          <Button asChild className="w-full justify-start h-9 text-sm" size="sm">
                            <Link to="/login">
                              <Icon icon="mdi:login" className="mr-2 h-5 w-5" />
                              {t('header.sign_in')}
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                           <Button asChild variant="outline" className="w-full justify-start h-9 text-sm" size="sm">
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
                    <nav className="flex flex-col gap-1.5">
                      <h4 className="px-2 mb-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('header.menu')}
                      </h4>
                      {navigationItems.map((item) => (
                        <SheetClose asChild key={item.id}>
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
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
                    <div className="space-y-2">
                       <h4 className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                         {t('header.language')}
                       </h4>
                       <div className="grid grid-cols-2 gap-1.5">
                          {LANGUAGES.map((lang) => (
                            <Button
                              key={lang.code}
                              variant={i18n.language === lang.code ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "w-full justify-start h-8 text-xs",
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
                  <div className="px-3 py-2.5 border-t bg-slate-50 mt-auto">
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

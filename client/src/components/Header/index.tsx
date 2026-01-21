import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import LanguageSwitcher, { LANGUAGES } from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { cn } from '@/lib/utils';

const STORAGE_KEY_USER = 'projectx_auth_user';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
}

interface HeaderProps {
  user?: User | null;
  navigationItems: NavigationItem[];
  onNavigate?: (href: string) => void;
  /** Force the header to render in mobile mode regardless of viewport width */
  forceMobile?: boolean;
  /** Force the header to appear in its scrolled (solid/dark) state */
  forceScrolled?: boolean;
}

/**
 * Header component - Copart-inspired design
 * Dark blue gradient with search bar and navigation
 */
const Header: React.FC<HeaderProps> = ({ user, navigationItems, onNavigate, forceMobile = false, forceScrolled = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user: authUser, logout, isInitialized } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if we're on the home page or VIN page for green transparent header
  const isGreenHeaderPage = location.pathname === '/' || location.pathname === '/vin';

  // Track scroll position for header background transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const effectiveUser = authUser ?? storedUser ?? user ?? null;

  const effectiveMenuUser = effectiveUser
    ? {
      id: String(effectiveUser.id),
      name: effectiveUser.name ?? effectiveUser.email,
      email: effectiveUser.email,
      avatar: effectiveUser.avatar ?? '',
    }
    : null;

  const handleNavClick = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      navigate(href);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/auction-listings?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('i18nextLng', langCode);
    } catch (e) {
      console.error('Failed to save language preference', e);
    }
  };

  // Header style: glass effect on green pages (not scrolled), solid on scrolled
  // Green on home page and VIN page, navy blue on all other pages
  const showGlassHeader = isGreenHeaderPage && !isScrolled && !forceScrolled;

  // Navy blue CSS variable overrides for non-green pages
  // These override the same variables the header already uses via Tailwind classes
  // Use the standard green/glass header everywhere (removed navy overrides)
  const navyVariableOverrides: React.CSSProperties = {};

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl backdrop-saturate-150 border-b border-[var(--header-glass-border)]",
        showGlassHeader
          ? "bg-[var(--header-glass-bg)]"
          : "bg-[var(--header-glass-bg-scrolled)] shadow-[var(--header-glass-shadow)]"
      )}
      style={{
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        ...navyVariableOverrides,
      }}
      role="banner"
    >
      {/* Top Bar */}
      <div className="transition-colors duration-300">
        {/* Full-width below 1024px, centered and capped width on lg+ */}
        <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "font-logo-bebas tracking-wide",
                forceMobile ? "text-xl" : "text-sm min-[330px]:text-base min-[390px]:text-xl md:text-2xl"
              )}>
                <span className="text-accent font-bold">Trusted</span>{' '}
                <span className="text-white font-normal">Importers</span>
              </span>
            </Link>

            {/* Desktop search temporarily disabled
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
              <div className="relative w-full flex">
                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('auction.search.placeholder')}
                  className="w-full h-10 pl-10 pr-4 rounded-l-md rounded-r-none border-0 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                  type="submit"
                  className="h-10 px-6 rounded-l-none rounded-r-md bg-accent hover:bg-accent/90 text-primary"
                >
                  <Icon icon="mdi:magnify" className="w-5 h-5 text-white" />
                </Button>
              </div>
            </form>
            */}

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* Language Switcher */}
              <div className={cn("items-center", forceMobile ? "hidden" : "hidden lg:flex")}>
                <LanguageSwitcher />
              </div>

              {/* Auth Buttons */}
              {!isInitialized ? (
                /* Skeleton placeholder while auth is initializing */
                <div className={cn("items-center gap-2", forceMobile ? "hidden" : "hidden sm:flex")}>
                  <Skeleton className="h-7 w-7 rounded-full bg-white/20" />
                  <Skeleton className="h-4 w-20 rounded bg-white/20" />
                </div>
              ) : effectiveMenuUser ? (
                <UserMenu user={effectiveMenuUser} onLogout={logout} theme="dark" />
              ) : (
                <div className={cn("items-center gap-2", forceMobile ? "hidden" : "flex")}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/register')}
                    className={cn(
                      "hidden sm:flex h-8 px-4 rounded-full text-sm font-medium transition-all",
                      showGlassHeader
                        ? "bg-[var(--glass-surface)] border-[var(--glass-border)] text-white hover:bg-[var(--glass-surface-hover)] hover:border-[var(--glass-border-hover)] backdrop-blur-sm"
                        : "bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white",
                      forceMobile && "hidden"
                    )}
                  >
                    {t('navigation.register')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/login')}
                    className={cn(
                      "hidden sm:flex h-8 px-5 bg-white hover:bg-white/90 text-[var(--hero-gradient-start)] rounded-full text-sm font-semibold shadow-lg shadow-black/10",
                      forceMobile && "hidden"
                    )}
                  >
                    {t('navigation.sign_in')}
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-white hover:bg-white/10",
                      forceMobile ? "flex" : "lg:hidden"
                    )}
                  >
                    <Icon icon="mdi:menu" className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0 bg-primary">
                  <SheetHeader className="px-4 py-4 border-b border-white/10">
                    <SheetTitle className="font-logo-bebas text-xl tracking-wide">
                      <span className="text-accent font-bold">Trusted</span>{' '}
                      <span className="text-white font-normal">Importers</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="px-4 mb-4">
                      <div className="relative">
                        <Input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('auction.search.mobilePlaceholder')}
                          className="w-full h-10 pl-10 pr-4 rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                        <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      </div>
                    </form>

                    {/* Mobile Nav Links */}
                    {navigationItems.map((item) => (
                      <SheetClose asChild key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleNavClick(item.href)}
                          className="px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {t(item.label)}
                        </button>
                      </SheetClose>
                    ))}

                    <div className="border-t border-white/10 mt-4 pt-4 px-4 space-y-2">
                      {/* Language Selector */}
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-semibold text-white/70 uppercase tracking-wider px-1">
                          {t('header.language') || 'Language'}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {LANGUAGES.map((lang) => (
                            <Button
                              key={lang.code}
                              variant={i18n.language === lang.code ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'w-full justify-start h-9 text-xs border-white/20 text-white',
                                i18n.language === lang.code
                                  ? 'bg-accent text-primary'
                                  : 'bg-white/5 hover:bg-white/10'
                              )}
                              onClick={() => handleLanguageChange(lang.code)}
                            >
                              <Icon icon={lang.icon} className="mr-2 h-4 w-4 rounded-full" />
                              <span className="truncate">{lang.label}</span>
                              {i18n.language === lang.code && <Icon icon="mdi:check" className="ml-auto h-4 w-4" />}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Active listings CTA */}
                      <SheetClose asChild>
                        <Button
                          onClick={() => navigate('/auction-listings')}
                          className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold"
                        >
                          {t('auction.header.active_listings_cta')}
                        </Button>
                      </SheetClose>

                      {/* Register / Login buttons, same golden style */}
                      {!isInitialized ? (
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-10 w-full rounded bg-white/20" />
                          <Skeleton className="h-10 w-full rounded bg-white/20" />
                        </div>
                      ) : !effectiveMenuUser && (
                        <div className="flex flex-col gap-2">
                          <SheetClose asChild>
                            <Button
                              onClick={() => navigate('/register')}
                              className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold"
                            >
                              {t('navigation.register')}
                            </Button>
                          </SheetClose>

                          <SheetClose asChild>
                            <Button
                              onClick={() => navigate('/login')}
                              className="w-full bg-accent hover:bg-accent/90 text-primary font-semibold"
                            >
                              {t('navigation.sign_in')}
                            </Button>
                          </SheetClose>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar - Glass style (hidden below 1024px) */}
      <div className={cn(
        "border-t border-[var(--header-glass-border)] transition-all duration-300",
        forceMobile ? "hidden" : "hidden lg:block"
      )}>
        <div className="px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
          <div className="flex items-center justify-between h-10">
            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
                      isActive
                        ? 'text-white bg-[var(--header-nav-active)] border border-[var(--header-nav-active-border)] shadow-sm'
                        : 'text-white/85 hover:text-white hover:bg-[var(--header-nav-hover)] border border-transparent'
                    )
                  }
                >
                  {t(item.label)}
                  {/* Dropdown indicator for items with submenus */}
                  {(item.id === 'inventory' || item.id === 'auctions' || item.id === 'services') && (
                    <Icon icon="mdi:chevron-down" className="inline-block ml-1 w-4 h-4" />
                  )}
                </NavLink>
              ))}
            </nav>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useAuth } from '@/hooks/useAuth';

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
}

// TODO-FX: Connect to i18n library.
const t = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const Header: React.FC<HeaderProps> = ({ user, navigationItems }) => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const effectiveUser = isAuthenticated ? authUser : user ?? null;
  // TODO-FX: Replace with real API call.
  // API Endpoint: GET /api/user/profile
  // Expected Data:
  // type: object
  // properties:
  //   id:
  //     type: string
  //   name:
  //     type: string
  //   email:
  //     type: string
  //     format: email
  //   avatar:
  //     type: string
  //     format: uri

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Icon icon="mdi:home" className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              {t('header.brand')}
            </span>
          </a>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item: NavigationItem) => (
              <Link
                key={item.id}
                to={item.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {t(`navigation.${item.id}`)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              size="icon"
              aria-label={t('header.menu')}
            >
              <Icon icon="mdi:menu" className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex items-center">
            {effectiveUser ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{effectiveUser.name}</span>
                <img
                  src={effectiveUser.avatar}
                  alt={t('header.avatar_alt')}
                  className="h-8 w-8 rounded-full"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={logout}
                  aria-label={t('header.sign_out')}
                >
                  <Icon icon="mdi:logout" className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
                aria-label={t('header.sign_in')}
              >
                <Icon icon="mdi:login" className="mr-2 h-4 w-4" />
                {t('header.sign_in')}
              </Button>
            )}
          </nav>
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
};

export default Header;

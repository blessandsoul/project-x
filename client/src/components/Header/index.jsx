import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY_USER = "projectx_auth_user";

const Header = ({ user, navigationItems, onNavigate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: authUser } = useAuth();

  let storedUser = null;

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_USER);
      if (raw) {
        storedUser = JSON.parse(raw);
      }
    } catch {
      storedUser = null;
    }
  }

  const effectiveUser = authUser || storedUser || user || null;
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
          <Link className="mr-6 flex items-center space-x-2" to="/">
            <Icon icon="mdi:home" className="h-6 w-6" />
            <span className="hidden sm:inline-block font-logo-bebas text-xl tracking-wide">
              <span className="font-bold">Trusted</span>{" "}
              <span className="font-normal">Importers.Ge</span>
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.href)}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {t(`navigation.${item.id}`)}
              </button>
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
              aria-label={t("header.menu")}
            >
              <Icon icon="mdi:menu" className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex items-center">
            {effectiveUser ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {effectiveUser.name}
                </span>
                {effectiveUser.avatar && (
                  <img
                    src={effectiveUser.avatar}
                    alt={t("header.avatar_alt")}
                    className="h-8 w-8 rounded-full"
                  />
                )}
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/login")}
                aria-label={t("header.sign_in")}
              >
                <Icon icon="mdi:login" className="mr-2 h-4 w-4" />
                {t("header.sign_in")}
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
  onNavigate: PropTypes.func,
};

Header.defaultProps = {
  user: null,
  onNavigate: () => {},
};

export default Header;

import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react/dist/iconify.js';

// TODO-FX: Connect to i18n library.
const t = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const Footer = ({ footerLinks, onNavigate }) => {
  const currentYear = new Date().getFullYear();

  // TODO-FX: Replace with real API call.
  // API Endpoint: GET /api/footer/links
  // Expected Data:
  // type: array
  // items:
  //   type: object
  //   properties:
  //     id:
  //       type: string
  //     label:
  //       type: string
  //     href:
  //       type: string

  return (
    <footer className="border-t bg-background" role="contentinfo">
      <div className="container mx-auto py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:home" className="h-6 w-6" />
              <span className="font-bold">{t('footer.brand')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>

          {/* Links sections */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('footer.company')}</h4>
            <nav className="flex flex-col space-y-2">
              {footerLinks.slice(0, 3).map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate?.(link.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {t(`footer.${link.id}`)}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('footer.support')}</h4>
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => onNavigate?.('/help')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {t('footer.help')}
              </button>
              <button
                onClick={() => onNavigate?.('/contact')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {t('footer.contact')}
              </button>
            </nav>
          </div>

          {/* Social links */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('footer.connect')}</h4>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="mdi:twitter" className="h-4 w-4" />
                <span className="sr-only">{t('footer.twitter')}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="mdi:github" className="h-4 w-4" />
                <span className="sr-only">{t('footer.github')}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="mdi:linkedin" className="h-4 w-4" />
                <span className="sr-only">{t('footer.linkedin')}</span>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('footer.brand')}. {t('footer.copyright')}
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <button
              onClick={() => onNavigate?.('/privacy')}
              className="hover:text-foreground transition-colors"
            >
              {t('footer.privacy')}
            </button>
            <button
              onClick={() => onNavigate?.('/terms')}
              className="hover:text-foreground transition-colors"
            >
              {t('footer.terms')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  footerLinks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ).isRequired,
  onNavigate: PropTypes.func,
};

Footer.defaultProps = {
  onNavigate: () => {},
};

export default Footer;

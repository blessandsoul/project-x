import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react/dist/iconify.js';

interface FooterLink {
  id: string;
  label: string;
  href: string;
}

interface FooterProps {
  footerLinks: FooterLink[];
}

const Footer: React.FC<FooterProps> = ({ footerLinks }) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background" role="contentinfo">
      <div className="container mx-auto max-w-6xl px-2 sm:px-4 lg:px-6 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand & trust section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:home" className="h-6 w-6" />
              <span className="font-logo-bebas text-xl tracking-wide">
                <span className="font-bold">Trusted</span>{' '}
                <span className="font-normal">Importers.Ge</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.description')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('footer.stats.region')}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">{t('footer.stats.cars')}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{t('footer.stats.years')}</p>
              </div>
            </div>
          </div>

          {/* Links sections */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('footer.company')}</h4>
            <nav className="flex flex-col space-y-2" aria-label="Footer company navigation">
              {footerLinks.slice(0, 3).map((link: FooterLink) => (
                <Link
                  key={link.id}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-start"
                >
                  {t(`footer.${link.id}`)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('footer.support')}</h4>
            <nav className="flex flex-col space-y-2" aria-label="Footer support navigation">
              <Link
                to="/help"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {t('footer.help')}
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {t('footer.contact')}
              </Link>
            </nav>
          </div>

          {/* Social + CTA */}
          <div className="space-y-4">
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
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('footer.cta.title')}</p>
              <p className="text-xs text-muted-foreground">{t('footer.cta.subtitle')}</p>
              <Button className="mt-1" asChild>
                <Link to="/contact">{t('footer.cta.button')}</Link>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear}{' '}
            <span className="font-logo-bebas inline-flex items-baseline gap-1">
              <span className="font-bold">Trusted</span>{' '}
              <span className="font-normal">Importers.Ge</span>
            </span>{' '}
            {t('footer.copyright')}
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              {t('footer.terms')}
            </Link>
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
};

export default Footer;

import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react/dist/iconify.js";

const Footer = ({ footerLinks, onNavigate }) => {
  const { t } = useTranslation();
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
      <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto py-6 md:py-10 text-center md:text-left">
        <div className="grid gap-6 md:gap-8 md:grid-cols-4">
          {/* Brand & trust section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Icon icon="mdi:home" className="h-6 w-6" />
              <span className="font-logo-bebas text-xl tracking-wide">
                <span className="font-bold">Trusted</span>{" "}
                <span className="font-normal">Importers.Ge</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("footer.stats.region")}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">{t("footer.stats.cars")}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{t("footer.stats.years")}</p>
              </div>
            </div>
          </div>

          {/* Links sections */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <h4 className="text-sm font-medium">{t("footer.company")}</h4>
            <nav
              className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1"
              aria-label="Footer company navigation"
            >
              {footerLinks.slice(0, 3).map((link) => {
                const isPrivacy = link.id === "privacy";

                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onNavigate?.(link.href)}
                    className={`w-full rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-center md:text-left ${
                      isPrivacy ? "col-span-2" : ""
                    }`}
                  >
                    {t(`footer.${link.id}`)}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <h4 className="text-sm font-medium">{t("footer.support")}</h4>
            <nav
              className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1"
              aria-label="Footer support navigation"
            >
              <button
                type="button"
                onClick={() => onNavigate?.("/help")}
                className="w-full rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-center md:text-left"
              >
                {t("footer.help")}
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.("/contact")}
                className="w-full rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-center md:text-left"
              >
                {t("footer.contact")}
              </button>
            </nav>
          </div>

          {/* Social + CTA */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t("footer.connect")}</h4>
              <div className="flex justify-center md:justify-start space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon icon="mdi:twitter" className="h-4 w-4" />
                  <span className="sr-only">{t("footer.twitter")}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon icon="mdi:github" className="h-4 w-4" />
                  <span className="sr-only">{t("footer.github")}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon icon="mdi:linkedin" className="h-4 w-4" />
                  <span className="sr-only">{t("footer.linkedin")}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("footer.cta.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("footer.cta.subtitle")}
              </p>
              <Button
                type="button"
                className="mt-1"
                onClick={() => onNavigate?.("/contact")}
              >
                {t("footer.cta.button")}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4 md:my-6" />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear}{" "}
            <span className="font-logo-bebas inline-flex items-baseline gap-1">
              <span className="font-bold">Trusted</span>{" "}
              <span className="font-normal">Importers.Ge</span>
            </span>{" "}
            {t("footer.copyright")}
          </p>
          <div className="flex items-center justify-center md:justify-end space-x-4 text-sm text-muted-foreground">
            <button
              onClick={() => onNavigate?.("/privacy")}
              className="hover:text-foreground transition-colors"
            >
              {t("footer.privacy")}
            </button>
            <button
              onClick={() => onNavigate?.("/terms")}
              className="hover:text-foreground transition-colors"
            >
              {t("footer.terms")}
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

import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Footer translations for all supported languages
const footerTranslations = {
  ka: {
    sections: {
      navigation: {
        title: "ნავიგაცია",
        links: [
          { label: "მთავარი", href: "/" },
          { label: "ლოჯისტიკა", href: "/catalog" },
          { label: "ავტომობილები", href: "/auction-listings" },
          { label: "Carfax", href: "/vin" },
          { label: "კომპანიები", href: "/companies" },
        ],
      },
      company: {
        title: "კომპანია",
        links: [
          { label: "ჩვენს შესახებ", href: "/about" },
          { label: "კონტაქტი", href: "/contact" },
        ],
      },
      support: {
        title: "დახმარება",
        links: [
          { label: "დახმარების ცენტრი", href: "/help" },
          { label: "კალკულატორი", href: "/catalog" },
        ],
      },
    },
    connect: "დაგვიკავშირდით",
    downloadApp: "აპლიკაცია",
    partners: "პარტნიორები",
    copyright: "ყველა უფლება დაცულია.",
    bottomLinks: [
      { label: "წესები და პირობები", href: "/terms" },
      { label: "კონფიდენციალურობა", href: "/privacy" },
    ],
    appStoreAction: "ჩამოტვირთეთ",
    googlePlayAction: "შეიძინეთ",
  },
  en: {
    sections: {
      navigation: {
        title: "Navigation",
        links: [
          { label: "Home", href: "/" },
          { label: "Logistics", href: "/catalog" },
          { label: "Vehicles", href: "/auction-listings" },
          { label: "Carfax", href: "/vin" },
          { label: "Companies", href: "/companies" },
        ],
      },
      company: {
        title: "Company",
        links: [
          { label: "About Us", href: "/about" },
          { label: "Contact Us", href: "/contact" },
        ],
      },
      support: {
        title: "Support",
        links: [
          { label: "Help Center", href: "/help" },
          { label: "Calculator", href: "/catalog" },
        ],
      },
    },
    connect: "Connect With Us",
    downloadApp: "Get the App",
    partners: "Partners",
    copyright: "All rights reserved.",
    bottomLinks: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
    appStoreAction: "Download on the",
    googlePlayAction: "Get it on",
  },
  ru: {
    sections: {
      navigation: {
        title: "Навигация",
        links: [
          { label: "Главная", href: "/" },
          { label: "Логистика", href: "/catalog" },
          { label: "Автомобили", href: "/auction-listings" },
          { label: "Carfax", href: "/vin" },
          { label: "Компании", href: "/companies" },
        ],
      },
      company: {
        title: "Компания",
        links: [
          { label: "О нас", href: "/about" },
          { label: "Контакты", href: "/contact" },
        ],
      },
      support: {
        title: "Поддержка",
        links: [
          { label: "Центр помощи", href: "/help" },
          { label: "Калькулятор", href: "/catalog" },
        ],
      },
    },
    connect: "Мы в соцсетях",
    downloadApp: "Приложение",
    partners: "Партнёры",
    appStoreAction: "Загрузите в",
    googlePlayAction: "Доступно в",
    copyright: "Все права защищены.",
    bottomLinks: [
      { label: "Условия использования", href: "/terms" },
      { label: "Политика конфиденциальности", href: "/privacy" },
    ],
  },
};

const Footer = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  // Get current language translations, fallback to Georgian
  const lang = i18n.language?.substring(0, 2) || "ka";
  const t = footerTranslations[lang] || footerTranslations.ka;

  // Handle language change
  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem("i18nextLng", langCode);
    } catch (e) {
      console.error("Failed to save language preference", e);
    }
  };

  const socialLinks = [
    { icon: "mdi:facebook", label: "Facebook", href: "https://facebook.com" },
    {
      icon: "mdi:instagram",
      label: "Instagram",
      href: "https://instagram.com",
    },
    { icon: "ic:baseline-tiktok", label: "TikTok", href: "https://tiktok.com" },
    { icon: "mdi:linkedin", label: "LinkedIn", href: "https://linkedin.com" },
    { icon: "mdi:youtube", label: "YouTube", href: "https://youtube.com" },
  ];

  const FooterLink = ({ href, children }) => {
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-accent transition-colors text-sm leading-relaxed"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        to={href}
        onClick={() => onNavigate?.(href)}
        className="text-white hover:text-accent transition-colors text-sm leading-relaxed"
      >
        {children}
      </Link>
    );
  };

  FooterLink.propTypes = {
    href: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };

  const FooterSection = ({ title, links }) => (
    <div className="space-y-4">
      <h3 className="text-accent font-semibold text-sm uppercase tracking-wide">
        {title}
      </h3>
      <nav aria-label={title}>
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={index}>
              <FooterLink href={link.href}>{link.label}</FooterLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  FooterSection.propTypes = {
    title: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
      })
    ).isRequired,
  };

  return (
    <footer 
      className="text-white relative overflow-hidden" 
      role="contentinfo"
      style={{
        background: `linear-gradient(135deg, var(--hero-gradient-start) 0%, var(--hero-gradient-mid) 50%, var(--hero-gradient-end) 100%)`,
      }}
    >
      {/* Main footer content */}
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-10 lg:py-14 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Column 1: Brand & Selectors */}
          <div className="space-y-6 sm:col-span-2 md:col-span-1 xl:col-span-1">
            {/* Logo */}
            <Link to="/" className="inline-block">
              <span className="font-logo-bebas text-2xl tracking-wide">
                <span className="text-accent font-bold">Trusted</span>{" "}
                <span className="text-white font-normal">Importers</span>
              </span>
            </Link>

            {/* Language Selector */}
            <Select
              value={i18n.language?.substring(0, 2) || "ka"}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-full bg-white/5 text-gray-200 text-sm px-3 py-2 rounded border border-white/10 focus:ring-accent focus:ring-offset-0 h-[38px] hover:bg-white/10 transition-colors">
                 <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent className="bg-emerald-950/90 border-white/10 text-gray-200 backdrop-blur-xl">
                <SelectItem value="ka" className="focus:bg-white/10 focus:text-white cursor-pointer">GE ქართული</SelectItem>
                <SelectItem value="en" className="focus:bg-white/10 focus:text-white cursor-pointer">US English</SelectItem>
                <SelectItem value="ru" className="focus:bg-white/10 focus:text-white cursor-pointer">RU Русский</SelectItem>
              </SelectContent>
            </Select>

            {/* Partner logos */}
            <div className="space-y-2 pt-2">
              <p className="text-white/60 text-xs uppercase tracking-wide">
                {t.partners}
              </p>
              <div className="flex flex-col gap-2">
                <div className="bg-white/5 border border-white/10 rounded h-8 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-xs font-semibold tracking-wider">
                    Copart
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded h-8 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-xs font-semibold tracking-wider">IAAI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <FooterSection
            title={t.sections.navigation.title}
            links={t.sections.navigation.links}
          />

          {/* Column 3: Company */}
          <FooterSection
            title={t.sections.company.title}
            links={t.sections.company.links}
          />

          {/* Column 4: Support */}
          <FooterSection
            title={t.sections.support.title}
            links={t.sections.support.links}
          />

          {/* Column 5: Connect with Us / Apps */}
          <div className="space-y-6">
            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-accent font-semibold text-sm uppercase tracking-wide">
                {t.connect}
              </h3>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 border border-white/10 hover:bg-white/15 text-gray-300 hover:text-white p-2 rounded transition-all duration-300 backdrop-blur-sm"
                    aria-label={social.label}
                  >
                    <Icon icon={social.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* App Download */}
            <div className="space-y-4">
              <h3 className="text-accent font-semibold text-sm uppercase tracking-wide">
                {t.downloadApp}
              </h3>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="bg-white/5 border border-white/10 hover:bg-white/15 rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 backdrop-blur-sm group"
                >
                  <Icon icon="mdi:apple" className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-[10px] text-white/60 leading-none">
                      {t.appStoreAction}
                    </p>
                    <p className="text-white text-sm font-medium">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="bg-white/5 border border-white/10 hover:bg-white/15 rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 backdrop-blur-sm group"
                >
                  <Icon icon="mdi:google-play" className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-[10px] text-white/60 leading-none">
                      {t.googlePlayAction}
                    </p>
                    <p className="text-white text-sm font-medium">
                      Google Play
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10 relative z-10 bg-black/10">
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Copyright */}
            <p className="text-white/40 text-xs text-center md:text-left">
              © {currentYear}{" "}
              <span className="font-logo-bebas">
                <span className="text-accent font-bold">Trusted</span>
                <span className="text-white/60 font-normal">Importers</span>
              </span>
              . {t.copyright}
            </p>

            {/* Bottom links */}
            <nav aria-label="Footer legal links">
              <ul className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1">
                {t.bottomLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-white/40 hover:text-white text-xs transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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
  ),
  onNavigate: PropTypes.func,
};

Footer.defaultProps = {
  footerLinks: [],
  onNavigate: () => {},
};

export default Footer;

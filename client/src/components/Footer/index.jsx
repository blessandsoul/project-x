import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react/dist/iconify.js";

// Footer translations for all supported languages
const footerTranslations = {
  ka: {
    sections: {
      trustedImporters: {
        title: "TrustedImporters",
        links: [
          { label: "ჩვენს შესახებ", href: "/about" },
          { label: "როგორ მუშაობს პლატფორმა", href: "/how-it-works" },
          { label: "ჩვენი მისია", href: "/mission" },
          { label: "გუნდი", href: "/team" },
          { label: "სიახლეები / ბლოგი", href: "/blog" },
        ],
      },
      auctions: {
        title: "აუქციონები",
        links: [
          {
            label: "დღევანდელი აუქციონები",
            href: "/auction-listings?today=true",
          },
          { label: "აუქციონების კალენდარი", href: "/auction-calendar" },
          { label: "Copart ლოტები", href: "/auction-listings?source=copart" },
          { label: "IAAI ლოტები", href: "/auction-listings?source=iaai" },
          { label: "ამერიკული აუქციონები", href: "/auction-listings" },
        ],
      },
      services: {
        title: "სერვისები",
        links: [
          { label: "ტრანსპორტირების გამოთვლა", href: "/calculator" },
          { label: "იმპორტის სრული ღირებულება", href: "/import-cost" },
          { label: "პარტნიორი კომპანიები", href: "/companies" },
          { label: "დილერებისთვის გადაწყვეტილებები", href: "/dealers" },
          { label: "სხვა დამატებითი სერვისები", href: "/services" },
        ],
      },
      support: {
        title: "დახმარება",
        links: [
          { label: "დახმარების ცენტრი", href: "/help" },
          { label: "ხშირი კითხვები (FAQ)", href: "/faq" },
          { label: "გზამკვლევი ახალ მომხმარებლებს", href: "/guide" },
          { label: "ფასები და ტარიფები", href: "/pricing" },
          { label: "კონტაქტი", href: "/contact" },
        ],
      },
    },
    connect: "დაგვიკავშირდით",
    downloadApp: "ჩამოტვირთე აპლიკაცია",
    partners: "პარტნიორები",
    copyright: "ყველა უფლება დაცულია.",
    bottomLinks: [
      { label: "საიტის რუკა", href: "/sitemap" },
      { label: "კონტაქტი", href: "/contact" },
      { label: "მომსახურების პირობები", href: "/terms" },
      { label: "კონფიდენციალურობა", href: "/privacy" },
      { label: "ქუქი-ფაილები", href: "/cookies" },
    ],
  },
  en: {
    sections: {
      trustedImporters: {
        title: "TrustedImporters",
        links: [
          { label: "About Us", href: "/about" },
          { label: "How It Works", href: "/how-it-works" },
          { label: "Our Mission", href: "/mission" },
          { label: "Team", href: "/team" },
          { label: "News / Blog", href: "/blog" },
        ],
      },
      auctions: {
        title: "Auctions",
        links: [
          { label: "Today's Auctions", href: "/auction-listings?today=true" },
          { label: "Auction Calendar", href: "/auction-calendar" },
          { label: "Copart Lots", href: "/auction-listings?source=copart" },
          { label: "IAAI Lots", href: "/auction-listings?source=iaai" },
          { label: "US Auctions", href: "/auction-listings" },
        ],
      },
      services: {
        title: "Services",
        links: [
          { label: "Shipping Calculator", href: "/calculator" },
          { label: "Full Import Cost", href: "/import-cost" },
          { label: "Partner Companies", href: "/companies" },
          { label: "Dealer Solutions", href: "/dealers" },
          { label: "Additional Services", href: "/services" },
        ],
      },
      support: {
        title: "Support",
        links: [
          { label: "Help Center", href: "/help" },
          { label: "FAQ", href: "/faq" },
          { label: "Beginner's Guide", href: "/guide" },
          { label: "Pricing & Tariffs", href: "/pricing" },
          { label: "Contact", href: "/contact" },
        ],
      },
    },
    connect: "Connect With Us",
    downloadApp: "Download the App",
    partners: "Partners",
    copyright: "All rights reserved.",
    bottomLinks: [
      { label: "Site Map", href: "/sitemap" },
      { label: "Contact Us", href: "/contact" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
  ru: {
    sections: {
      trustedImporters: {
        title: "TrustedImporters",
        links: [
          { label: "О нас", href: "/about" },
          { label: "Как это работает", href: "/how-it-works" },
          { label: "Наша миссия", href: "/mission" },
          { label: "Команда", href: "/team" },
          { label: "Новости / Блог", href: "/blog" },
        ],
      },
      auctions: {
        title: "Аукционы",
        links: [
          {
            label: "Сегодняшние аукционы",
            href: "/auction-listings?today=true",
          },
          { label: "Календарь аукционов", href: "/auction-calendar" },
          { label: "Лоты Copart", href: "/auction-listings?source=copart" },
          { label: "Лоты IAAI", href: "/auction-listings?source=iaai" },
          { label: "Американские аукционы", href: "/auction-listings" },
        ],
      },
      services: {
        title: "Услуги",
        links: [
          { label: "Калькулятор доставки", href: "/calculator" },
          { label: "Полная стоимость импорта", href: "/import-cost" },
          { label: "Компании-партнёры", href: "/companies" },
          { label: "Решения для дилеров", href: "/dealers" },
          { label: "Дополнительные услуги", href: "/services" },
        ],
      },
      support: {
        title: "Поддержка",
        links: [
          { label: "Центр помощи", href: "/help" },
          { label: "Частые вопросы (FAQ)", href: "/faq" },
          { label: "Руководство для новичков", href: "/guide" },
          { label: "Цены и тарифы", href: "/pricing" },
          { label: "Контакты", href: "/contact" },
        ],
      },
    },
    connect: "Свяжитесь с нами",
    downloadApp: "Скачать приложение",
    partners: "Партнёры",
    copyright: "Все права защищены.",
    bottomLinks: [
      { label: "Карта сайта", href: "/sitemap" },
      { label: "Связаться с нами", href: "/contact" },
      { label: "Условия использования", href: "/terms" },
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
  ar: {
    sections: {
      trustedImporters: {
        title: "TrustedImporters",
        links: [
          { label: "من نحن", href: "/about" },
          { label: "كيف يعمل", href: "/how-it-works" },
          { label: "مهمتنا", href: "/mission" },
          { label: "الفريق", href: "/team" },
          { label: "الأخبار / المدونة", href: "/blog" },
        ],
      },
      auctions: {
        title: "المزادات",
        links: [
          { label: "مزادات اليوم", href: "/auction-listings?today=true" },
          { label: "تقويم المزادات", href: "/auction-calendar" },
          { label: "عروض Copart", href: "/auction-listings?source=copart" },
          { label: "عروض IAAI", href: "/auction-listings?source=iaai" },
          { label: "المزادات الأمريكية", href: "/auction-listings" },
        ],
      },
      services: {
        title: "الخدمات",
        links: [
          { label: "حاسبة الشحن", href: "/calculator" },
          { label: "التكلفة الكاملة للاستيراد", href: "/import-cost" },
          { label: "الشركات الشريكة", href: "/companies" },
          { label: "حلول للتجار", href: "/dealers" },
          { label: "خدمات إضافية", href: "/services" },
        ],
      },
      support: {
        title: "الدعم",
        links: [
          { label: "مركز المساعدة", href: "/help" },
          { label: "الأسئلة الشائعة", href: "/faq" },
          { label: "دليل المبتدئين", href: "/guide" },
          { label: "الأسعار والتعريفات", href: "/pricing" },
          { label: "اتصل بنا", href: "/contact" },
        ],
      },
    },
    connect: "تواصل معنا",
    downloadApp: "حمّل التطبيق",
    partners: "الشركاء",
    copyright: "جميع الحقوق محفوظة.",
    bottomLinks: [
      { label: "خريطة الموقع", href: "/sitemap" },
      { label: "اتصل بنا", href: "/contact" },
      { label: "شروط الخدمة", href: "/terms" },
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "ملفات تعريف الارتباط", href: "/cookies" },
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
          className="text-gray-400 hover:text-white transition-colors text-sm leading-relaxed"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        to={href}
        onClick={() => onNavigate?.(href)}
        className="text-gray-400 hover:text-white transition-colors text-sm leading-relaxed"
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
      <h3 className="text-[#f5a623] font-semibold text-sm uppercase tracking-wide">
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
    <footer className="bg-[#12151d]" role="contentinfo">
      {/* Main footer content */}
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Column 1: Brand & Selectors */}
          <div className="space-y-6 sm:col-span-2 md:col-span-1 xl:col-span-1">
            {/* Logo */}
            <Link to="/" className="inline-block">
              <span className="font-logo-bebas text-2xl tracking-wide">
                <span className="text-[#f5a623] font-bold">Trusted</span>{" "}
                <span className="text-white font-normal">Importers</span>
              </span>
            </Link>

            {/* Language Selector */}
            <div className="relative">
              <select
                className="w-full bg-[#1a1f2e] text-gray-300 text-sm px-3 py-2 rounded border border-gray-700 focus:border-[#f5a623] focus:outline-none appearance-none cursor-pointer"
                value={i18n.language?.substring(0, 2) || "ka"}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="ka">GE ქართული</option>
                <option value="en">US English</option>
                <option value="ru">RU Русский</option>
                <option value="ar">SA العربية</option>
              </select>
              <Icon
                icon="mdi:chevron-down"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none"
              />
            </div>

            {/* Partner logos */}
            <div className="space-y-2 pt-2">
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                {t.partners}
              </p>
              <div className="flex flex-col gap-2">
                <div className="bg-[#002d72] rounded h-8 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    Copart
                  </span>
                </div>
                <div className="bg-[#c41230] rounded h-8 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">IAAI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: TrustedImporters */}
          <FooterSection
            title={t.sections.trustedImporters.title}
            links={t.sections.trustedImporters.links}
          />

          {/* Column 3: Auctions */}
          <FooterSection
            title={t.sections.auctions.title}
            links={t.sections.auctions.links}
          />

          {/* Column 4: Services */}
          <FooterSection
            title={t.sections.services.title}
            links={t.sections.services.links}
          />

          {/* Column 5: Support */}
          <FooterSection
            title={t.sections.support.title}
            links={t.sections.support.links}
          />

          {/* Column 6: Connect with Us / Apps */}
          <div className="space-y-6">
            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-[#f5a623] font-semibold text-sm uppercase tracking-wide">
                {t.connect}
              </h3>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1a1f2e] hover:bg-[#252a3a] text-gray-400 hover:text-white p-2 rounded transition-colors"
                    aria-label={social.label}
                  >
                    <Icon icon={social.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* App Download */}
            <div className="space-y-4">
              <h3 className="text-[#f5a623] font-semibold text-sm uppercase tracking-wide">
                {t.downloadApp}
              </h3>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="bg-[#1a1f2e] hover:bg-[#252a3a] rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
                >
                  <Icon icon="mdi:apple" className="h-6 w-6 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">
                      Download on the
                    </p>
                    <p className="text-white text-sm font-medium">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="bg-[#1a1f2e] hover:bg-[#252a3a] rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
                >
                  <Icon icon="mdi:google-play" className="h-6 w-6 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">
                      Get it on
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
      <div className="border-t border-gray-800">
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-xs text-center md:text-left">
              © {currentYear}{" "}
              <span className="font-logo-bebas">
                <span className="text-[#f5a623] font-bold">Trusted</span>
                <span className="text-gray-400 font-normal">Importers</span>
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
                      className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
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

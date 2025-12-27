import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';

export const LANGUAGES = [
  { code: 'ka', label: 'ქართული', icon: 'circle-flags:ge' },
  { code: 'en', label: 'English', icon: 'circle-flags:us' },
  { code: 'ru', label: 'Русский', icon: 'circle-flags:ru' },
  { code: 'ar', label: 'العربية', icon: 'circle-flags:sa' },
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]; // Default to KA (Georgian)

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('i18nextLng', langCode);
    } catch (e) {
      console.error('Failed to save language preference', e);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className="w-9 px-0">
        <span className="h-5 w-5 rounded-full bg-slate-200 animate-pulse" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 px-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('header.language') || 'Change language'}
        >
          <Icon
            icon={currentLanguage.icon}
            className="text-xl rounded-full h-6 w-6 shadow-sm border border-slate-200 dark:border-slate-700 object-cover"
          />
          <span className="sr-only">{currentLanguage.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {LANGUAGES.filter((lang) => lang.code !== 'ar').map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center gap-3 cursor-pointer font-medium py-2"
          >
            <Icon
              icon={lang.icon}
              className="text-lg rounded-full h-5 w-5 border border-slate-200 dark:border-slate-700 shadow-sm"
            />
            <span className={i18n.language === lang.code ? "text-primary" : ""}>
              {lang.label}
            </span>
            {i18n.language === lang.code && (
              <Icon icon="mdi:check" className="ms-auto h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;


import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react/dist/iconify.js';

const LANGUAGES = [
  { code: 'ka', label: 'ქართული', icon: 'circle-flags:ge' },
  { code: 'en', label: 'English', icon: 'circle-flags:us' },
  { code: 'ru', label: 'Русский', icon: 'circle-flags:ru' },
  { code: 'ar', label: 'العربية', icon: 'circle-flags:sa' },
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    try {
      window.localStorage.setItem('i18nextLng', langCode);
    } catch {
      // ignore storage errors (e.g. disabled cookies)
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('header.language')}>
          <Icon icon={currentLanguage.icon} className="text-lg rounded-full h-5 w-5" />
          <span className="sr-only">{currentLanguage.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Icon icon={lang.icon} className="text-lg rounded-full h-4 w-4" />
            <span>{lang.label}</span>
            {i18n.language === lang.code && (
              <Icon icon="mdi:check" className="ms-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;


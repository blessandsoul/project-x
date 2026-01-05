import { FC } from 'react';

interface FooterLink {
  id: string;
  label: string;
  href: string;
}

interface FooterProps {
  footerLinks?: FooterLink[];
  onNavigate?: (href: string) => void;
}

declare const Footer: FC<FooterProps>;
export default Footer;

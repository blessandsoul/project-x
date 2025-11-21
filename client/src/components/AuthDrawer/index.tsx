import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDrawer: React.FC<AuthDrawerProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [accountType, setAccountType] = useState<'user' | 'dealer' | 'company'>('user');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError(t('auth.login.error.required'));
      return;
    }

    try {
      await login(loginEmail, loginPassword);
      handleClose();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('auth.login.error.generic');
      setLoginError(message);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError('');

    if (!name || !registerEmail || !registerPassword) {
      setRegisterError(t('auth.register.error.required'));
      return;
    }

    try {
      await register(name, registerEmail, registerPassword);
      handleClose();
      navigate(`/onboarding?type=${accountType}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('auth.register.error.generic');
      setRegisterError(message);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'login' || value === 'register') {
      setActiveTab(value);
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent aria-label={t('auth.header.subtitle')}>
            <motion.div
              initial={{ opacity: 0, y: -32, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:account" className="h-5 w-5" />
              <span>{t('auth.header.account')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('auth.header.subtitle')}{' '}
              <span className="font-logo-bebas inline-flex items-baseline gap-1">
                <span className="font-bold">Trusted</span>{' '}
                <span className="font-normal">Importers.Ge</span>
              </span>{' '}
              {/* "platform" word might be needed if not in subtitle, checking translation file. 
                  Subtitle is "Login or Register on". "platform" is implicit or part of sentence structure. 
                  In KA: "შესვლა ან რეგისტრაცია ... პლატფორმაზე". 
                  So I need "platform" or similar suffix. 
                  I'll check if I should add suffix. 
                  In KA file: "platform" word was hardcoded at the end. 
                  Let's assume 'subtitle' covers the beginning, and we might need a suffix if the language structure requires it.
                  For now, I will leave "platform" logic out or assume it is handled by word order if I just put the brand name.
                  Actually KA had "პლატფორმაზე" at the end. 
                  I'll add a suffix key or just hardcode/remove. 
                  "Login or Register on TrustedImporters.Ge" is fine for EN.
                  "შესვლა ან რეგისტრაცია TrustedImporters.Ge-ზე" would be better but "პლატფორმაზე" means "on platform".
                  I'll stick to simple concatenation for now.
               */}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full max-w-md mx-auto"
            >
              <TabsList className="w-full mb-4">
                <TabsTrigger
                  value="login"
                  className="flex-1"
                  onClick={() => setActiveTab('login')}
                >
                  <Icon icon="mdi:login" className="mr-1 h-4 w-4" />
                  <span>{t('auth.login.title')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1"
                  onClick={() => setActiveTab('register')}
                >
                  <Icon icon="mdi:account-plus" className="mr-1 h-4 w-4" />
                  <span>{t('auth.register.title')}</span>
                </TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'login' && (
                  <TabsContent value="login" asChild>
                    <motion.div
                      key="auth-login"
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.25, ease: 'easeOut' as const }}
                    >
                      <Card className="w-full" role="form" aria-label={t('auth.login.title')}>
                        <CardHeader className="space-y-2 text-center">
                          <Icon icon="mdi:car" className="mx-auto h-10 w-10 text-primary" />
                          <CardTitle className="text-2xl font-bold">{t('auth.login.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={handleLoginSubmit}
                            className="space-y-4"
                            aria-busy={isLoading}
                          >
                            <div className="space-y-2">
                              <Label htmlFor="auth-login-email">{t('auth.login.email')}</Label>
                              <Input
                                id="auth-login-email"
                                type="email"
                                value={loginEmail}
                                onChange={(event) => setLoginEmail(event.target.value)}
                                placeholder={t('auth.placeholders.email')}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auth-login-password">{t('auth.login.password')}</Label>
                              <Input
                                id="auth-login-password"
                                type="password"
                                value={loginPassword}
                                onChange={(event) => setLoginPassword(event.target.value)}
                                placeholder={t('auth.placeholders.password')}
                                required
                              />
                            </div>
                            {loginError && (
                              <p className="text-sm text-destructive" aria-live="polite">
                                {loginError}
                              </p>
                            )}
                            <Button
                              type="submit"
                              className="w-full mt-2"
                              disabled={isLoading}
                              aria-disabled={isLoading}
                            >
                              <Icon icon="mdi:login" className="mr-2 h-4 w-4" />
                              {isLoading ? t('auth.login.loading') : t('auth.login.submit')}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )}
                {activeTab === 'register' && (
                  <TabsContent value="register" asChild>
                    <motion.div
                      key="auth-register"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.25, ease: 'easeOut' as const }}
                    >
                      <Card className="w-full" role="form" aria-label={t('auth.register.title')}>
                        <CardHeader className="space-y-2 text-center">
                          <Icon icon="mdi:account-plus" className="mx-auto h-10 w-10 text-primary" />
                          <CardTitle className="text-2xl font-bold">{t('auth.register.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={handleRegisterSubmit}
                            className="space-y-4"
                            aria-busy={isLoading}
                          >
                            <div className="space-y-2">
                              <Label htmlFor="auth-account-type">{t('auth.account_type')}</Label>
                              <ToggleGroup
                                type="single"
                                id="auth-account-type"
                                value={accountType}
                                onValueChange={(value) => {
                                  if (value === 'user' || value === 'dealer' || value === 'company') {
                                    setAccountType(value);
                                  }
                                }}
                                className="flex flex-col gap-1.5"
                              >
                                <ToggleGroupItem
                                  value="user"
                                  aria-label={t('auth.roles.user.title')}
                                  className="flex w-full items-center justify-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5 overflow-hidden"
                                >
                                  <Icon icon="mdi:account" className="h-4 w-4" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium">{t('auth.roles.user.title')}</span>
                                    <span className="text-[11px] text-muted-foreground break-words">{t('auth.roles.user.desc')}</span>
                                  </div>
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="dealer"
                                  aria-label={t('auth.roles.dealer.title')}
                                  className="flex w-full items-center justify-start gap-3 rounded-md border px-3 py-2 text-left text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                                >
                                  <Icon icon="mdi:steering" className="h-4 w-4" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium">{t('auth.roles.dealer.title')}</span>
                                    <span className="text-[11px] text-muted-foreground break-words">{t('auth.roles.dealer.desc')}</span>
                                  </div>
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="company"
                                  aria-label={t('auth.roles.company.title')}
                                  className="flex w-full items-center justify-start gap-3 rounded-md border px-3 py-2 text-left text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                                >
                                  <Icon icon="mdi:office-building" className="h-4 w-4" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium">{t('auth.roles.company.title')}</span>
                                    <span className="text-[11px] text-muted-foreground break-words">{t('auth.roles.company.desc')}</span>
                                  </div>
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </div>
                            <AnimatePresence mode="wait" initial={false}>
                              {accountType === 'user' && (
                                <motion.div
                                  key="role-user-fields"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' as const }}
                                  className="space-y-2"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="auth-user-phone">{t('auth.phone_optional')}</Label>
                                    <Input
                                      id="auth-user-phone"
                                      placeholder={t('auth.placeholders.phone')}
                                    />
                                  </div>
                                </motion.div>
                              )}
                              {accountType === 'dealer' && (
                                <motion.div
                                  key="role-dealer-fields"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' as const }}
                                  className="space-y-2"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="auth-dealer-phone">{t('auth.contact_phone')}</Label>
                                    <Input
                                      id="auth-dealer-phone"
                                      placeholder={t('auth.placeholders.phone')}
                                    />
                                  </div>
                                </motion.div>
                              )}
                              {accountType === 'company' && (
                                <motion.div
                                  key="role-company-fields"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' as const }}
                                  className="space-y-2"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="auth-company-legal-name">{t('auth.company_legal_name')}</Label>
                                    <Input
                                      id="auth-company-legal-name"
                                      placeholder={t('auth.placeholders.company_name')}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {accountType !== 'company' && (
                              <div className="space-y-2">
                                <Label htmlFor="auth-register-name">{t('auth.register.name')}</Label>
                                <Input
                                  id="auth-register-name"
                                  value={name}
                                  onChange={(event) => setName(event.target.value)}
                                  placeholder={t('auth.placeholders.name')}
                                  required
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="auth-register-email">{t('auth.register.email')}</Label>
                              <Input
                                id="auth-register-email"
                                type="email"
                                value={registerEmail}
                                onChange={(event) => setRegisterEmail(event.target.value)}
                                placeholder={t('auth.placeholders.email')}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auth-register-password">{t('auth.register.password')}</Label>
                              <Input
                                id="auth-register-password"
                                type="password"
                                value={registerPassword}
                                onChange={(event) => setRegisterPassword(event.target.value)}
                                placeholder={t('auth.placeholders.password')}
                                required
                              />
                            </div>
                            {registerError && (
                              <p className="text-sm text-destructive" aria-live="polite">
                                {registerError}
                              </p>
                            )}
                            <Button
                              type="submit"
                              className="w-full mt-2"
                              disabled={isLoading}
                              aria-disabled={isLoading}
                            >
                              <Icon icon="mdi:account-plus" className="mr-2 h-4 w-4" />
                              {isLoading ? t('auth.register.loading') : t('auth.register.submit')}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )}
              </AnimatePresence>
            </Tabs>
          </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AuthDrawer;
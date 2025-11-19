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

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDrawer: React.FC<AuthDrawerProps> = ({ open, onOpenChange }) => {
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
      setLoginError('გთხოვთ შეიყვანოთ ელ-ფოსტა და პაროლი');
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
          : 'ავტორიზაციის დროს მოხდა შეცდომა';
      setLoginError(message);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError('');

    if (!name || !registerEmail || !registerPassword) {
      setRegisterError('გთხოვთ შეავსოთ ყველა ველი');
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
          : 'რეგისტრაციის დროს მოხდა შეცდომა';
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
          <DialogContent aria-label="ავტორიზაცია და რეგისტრაცია">
            <motion.div
              initial={{ opacity: 0, y: -32, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="mdi:account" className="h-5 w-5" />
              <span>ანგარიში</span>
            </DialogTitle>
            <DialogDescription>
              შესვლა ან რეგისტრაცია{' '}
              <span className="font-logo-bebas inline-flex items-baseline gap-1">
                <span className="font-bold">Trusted</span>{' '}
                <span className="font-normal">Importers.Ge</span>
              </span>{' '}
              პლატფორმაზე
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
                  <span>შესვლა</span>
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1"
                  onClick={() => setActiveTab('register')}
                >
                  <Icon icon="mdi:account-plus" className="mr-1 h-4 w-4" />
                  <span>რეგისტრაცია</span>
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
                      <Card className="w-full" role="form" aria-label="ავტორიზაცია">
                        <CardHeader className="space-y-2 text-center">
                          <Icon icon="mdi:car" className="mx-auto h-10 w-10 text-primary" />
                          <CardTitle className="text-2xl font-bold">ავტორიზაცია</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={handleLoginSubmit}
                            className="space-y-4"
                            aria-busy={isLoading}
                          >
                            <div className="space-y-2">
                              <Label htmlFor="auth-login-email">ელ-ფოსტა</Label>
                              <Input
                                id="auth-login-email"
                                type="email"
                                value={loginEmail}
                                onChange={(event) => setLoginEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auth-login-password">პაროლი</Label>
                              <Input
                                id="auth-login-password"
                                type="password"
                                value={loginPassword}
                                onChange={(event) => setLoginPassword(event.target.value)}
                                placeholder="••••••••"
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
                              {isLoading ? 'შესვლა...' : 'შესვლა'}
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
                      <Card className="w-full" role="form" aria-label="რეგისტრაცია">
                        <CardHeader className="space-y-2 text-center">
                          <Icon icon="mdi:account-plus" className="mx-auto h-10 w-10 text-primary" />
                          <CardTitle className="text-2xl font-bold">რეგისტრაცია</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={handleRegisterSubmit}
                            className="space-y-4"
                            aria-busy={isLoading}
                          >
                            <div className="space-y-2">
                              <Label htmlFor="auth-account-type">ანგარიშის ტიპი</Label>
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
                                  aria-label="ჩვეულობრივი მომხმარებელი"
                                  className="flex w-full items-center justify-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5 overflow-hidden"
                                >
                                  <Icon icon="mdi:account" className="h-4 w-4" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium">კლიენტი</span>
                                    <span className="text-[11px] text-muted-foreground break-words">ვინ ეძებს კომპანიებს და ტოვებს განაცხადებს</span>
                                  </div>
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="dealer"
                                  aria-label="დილერი"
                                  className="flex w-full items-center justify-start gap-3 rounded-md border px-3 py-2 text-left text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                                >
                                  <Icon icon="mdi:steering" className="h-4 w-4" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium">დილერი</span>
                                    <span className="text-[11px] text-muted-foreground break-words">ფიზიკური პირი, რომელიც ეძებს კლიენტებს იმპორტისთვის</span>
                                  </div>
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="company"
                                  aria-label="კომპანია"
                                  className="flex w-full items-center justify-start gap-3 rounded-md border px-3 py-2 text-left text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                                >
                                  <Icon icon="mdi:office-building" className="h-4 w-4" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium">კომპანია</span>
                                    <span className="text-[11px] text-muted-foreground break-words">ავტოიმპორტის/სერვისის კომპანია სრული პროფილით</span>
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
                                    <Label htmlFor="auth-user-phone">ტელეფონი (არასავალდებულო)</Label>
                                    <Input
                                      id="auth-user-phone"
                                      placeholder="+995 5XX XX XX XX"
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
                                    <Label htmlFor="auth-dealer-phone">საკონტაქტო ტელეფონი</Label>
                                    <Input
                                      id="auth-dealer-phone"
                                      placeholder="+995 5XX XX XX XX"
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
                                    <Label htmlFor="auth-company-legal-name">კომპანიის სრული სახელი</Label>
                                    <Input
                                      id="auth-company-legal-name"
                                      placeholder="Example Auto Import LLC"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {accountType !== 'company' && (
                              <div className="space-y-2">
                                <Label htmlFor="auth-register-name">სახელი</Label>
                                <Input
                                  id="auth-register-name"
                                  value={name}
                                  onChange={(event) => setName(event.target.value)}
                                  placeholder="გიორგი"
                                  required
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="auth-register-email">ელ-ფოსტა</Label>
                              <Input
                                id="auth-register-email"
                                type="email"
                                value={registerEmail}
                                onChange={(event) => setRegisterEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="auth-register-password">პაროლი</Label>
                              <Input
                                id="auth-register-password"
                                type="password"
                                value={registerPassword}
                                onChange={(event) => setRegisterPassword(event.target.value)}
                                placeholder="••••••••"
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
                              {isLoading ? 'რეგისტრაცია...' : 'რეგისტრაცია'}
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

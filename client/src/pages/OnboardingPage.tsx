import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

// Simple onboarding page shown after registration to collect role-specific details.

const OnboardingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const accountType = useMemo(() => {
    const raw = searchParams.get('type');
    if (raw === 'dealer' || raw === 'company' || raw === 'user') {
      return raw;
    }
    return 'user';
  }, [searchParams]);

  const handleFinish = () => {
    // TODO-FX: send collected data to backend before redirecting.
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-xl" aria-label="პროფილის პირველადი დაყენება">
        <CardHeader className="space-y-2 text-center">
          <Icon icon="mdi:account-cog" className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-2xl font-bold">
            {accountType === 'company'
              ? 'კომპანიის პროფილის დაყენება'
              : accountType === 'dealer'
                ? 'დილერის პროფილის დაყენება'
                : 'პროფილის დაყენება'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountType === 'user' && (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleFinish(); }}>
              <div className="space-y-2">
                <Label htmlFor="onboarding-user-city">ქალაქი</Label>
                <Input id="onboarding-user-city" placeholder="თბილისი" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-user-phone">ტელეფონი</Label>
                <Input id="onboarding-user-phone" placeholder="+995 5XX XX XX XX" />
              </div>
              <Button type="submit" className="w-full mt-2">
                გაგრძელება დაფაზე
              </Button>
            </form>
          )}

          {accountType === 'dealer' && (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleFinish(); }}>
              <div className="space-y-2">
                <Label htmlFor="onboarding-dealer-city">მუშაობის ქალაქი</Label>
                <Input id="onboarding-dealer-city" placeholder="თბილისი" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-dealer-experience">გამოცდილება (წლები)</Label>
                <Input id="onboarding-dealer-experience" type="number" min={0} placeholder="3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-dealer-phone">საკონტაქტო ტელეფონი</Label>
                <Input id="onboarding-dealer-phone" placeholder="+995 5XX XX XX XX" />
              </div>
              <Button type="submit" className="w-full mt-2">
                შენახვა და გაგრძელება
              </Button>
            </form>
          )}

          {accountType === 'company' && (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleFinish(); }}>
              <div className="space-y-2">
                <Label htmlFor="onboarding-company-name">კომპანიის სრული სახელი</Label>
                <Input
                  id="onboarding-company-name"
                  defaultValue={user?.name ?? ''}
                  placeholder="Example Auto Import LLC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-company-id">საიდენტიფიკაციო კოდი</Label>
                <Input id="onboarding-company-id" placeholder="XXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-company-city">ქალაქი / მდებარეობა</Label>
                <Input id="onboarding-company-city" placeholder="თბილისი" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-company-website">ვებ-საიტი</Label>
                <Input id="onboarding-company-website" placeholder="https://example.com" />
              </div>
              <Button type="submit" className="w-full mt-2">
                დაწყება პლატფორმით სარგებლობის
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;

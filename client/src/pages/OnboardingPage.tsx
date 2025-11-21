import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
// Import onboarding API and types
import { onboardingApi } from '@/services/onboardingService';
import type { UserOnboardingData, DealerOnboardingData, CompanyOnboardingData } from '@/services/onboardingService';
import { toast } from 'sonner';

const BODY_TYPES = ['Sedan', 'SUV', 'Coupe', 'Truck', 'Van', 'Hatchback', 'Convertible', 'Wagon'];
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
const USAGE_GOALS = [
  { value: 'commute', label: 'Daily Commute', icon: 'mdi:car-commute' },
  { value: 'family', label: 'Family', icon: 'mdi:account-group' },
  { value: 'resale', label: 'Resale / Business', icon: 'mdi:cash' },
  { value: 'fun', label: 'Fun / Weekend', icon: 'mdi:car-sports' },
  { value: 'other', label: 'Other', icon: 'mdi:dots-horizontal' },
];
const REGIONS = ['USA', 'Europe', 'Korea', 'Japan', 'China', 'UAE'];

const OnboardingPage = () => {
  const navigate = useNavigate();
  // Default to 'user' tab, but allow switching
  const [activeTab, setActiveTab] = useState('user');
  const [isLoading, setIsLoading] = useState(false);

  // User Form State
  const [userForm, setUserForm] = useState<UserOnboardingData>({
    budget_min: 5000,
    budget_max: 25000,
    body_types: [],
    fuel_types: [],
    usage_goal: undefined,
    target_regions: [],
    purchase_timeframe: undefined,
  });

  // Dealer Form State
  const [dealerForm, setDealerForm] = useState<DealerOnboardingData>({
    business_name: '',
    tax_id: '',
    license_number: '',
    inventory_size: undefined,
    specialty_brands: [],
    feed_url: '',
  });
  const [dealerBrandInput, setDealerBrandInput] = useState('');

  // Company Form State
  const [companyForm, setCompanyForm] = useState<CompanyOnboardingData>({
    name: '',
    services: [],
    base_price: 0,
    price_per_mile: 0,
    description: '',
    website: '',
    phone_number: '',
  });
  
  const handleUserSubmit = async () => {
    try {
      setIsLoading(true);
      await onboardingApi.submitUserOnboarding(userForm);
      toast.success('Preferences saved!');
      // navigate('/dashboard'); // Commenting out for testing
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDealerSubmit = async () => {
    try {
      setIsLoading(true);
      await onboardingApi.submitDealerOnboarding(dealerForm);
      toast.success('Dealer profile created!');
      // navigate('/dashboard'); // Commenting out for testing
    } catch (error) {
      toast.error('Failed to create dealer profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async () => {
    try {
      setIsLoading(true);
      await onboardingApi.submitCompanyOnboarding(companyForm);
      toast.success('Company profile created!');
      // navigate('/dashboard'); // Commenting out for testing
    } catch (error) {
      toast.error('Failed to create company profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Project X</h1>
          <p className="text-muted-foreground">Let's customize your experience based on your role.</p>
        </div>

        {/* Role Switcher / Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="user" className="py-3 flex flex-col gap-1">
              <Icon icon="mdi:account" className="h-5 w-5" />
              <span>I'm a Buyer</span>
            </TabsTrigger>
            <TabsTrigger value="dealer" className="py-3 flex flex-col gap-1">
              <Icon icon="mdi:store" className="h-5 w-5" />
              <span>I'm a Dealer</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="py-3 flex flex-col gap-1">
              <Icon icon="mdi:truck-fast" className="h-5 w-5" />
              <span>I'm a Logistics Company</span>
            </TabsTrigger>
          </TabsList>

          {/* USER ONBOARDING */}
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>Find Your Dream Car</CardTitle>
                <CardDescription>Tell us what you're looking for so we can recommend the best deals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Budget */}
                <div className="space-y-4">
                  <Label>Budget Range (USD)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                        <Input 
                            type="number" 
                            value={userForm.budget_min} 
                            onChange={(e) => setUserForm({...userForm, budget_min: Number(e.target.value)})} 
                        />
                    </div>
                    <Slider
                      defaultValue={[5000, 25000]}
                      min={0}
                      max={100000}
                      step={1000}
                      value={[userForm.budget_min || 0, userForm.budget_max || 100000]}
                      onValueChange={(vals) => setUserForm({ ...userForm, budget_min: vals[0], budget_max: vals[1] })}
                      className="flex-1"
                    />
                    <div className="w-24">
                        <Input 
                            type="number" 
                            value={userForm.budget_max} 
                            onChange={(e) => setUserForm({...userForm, budget_max: Number(e.target.value)})} 
                        />
                    </div>
                  </div>
                </div>

                {/* Body Types */}
                <div className="space-y-3">
                  <Label>Preferred Body Types</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BODY_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent cursor-pointer" onClick={() => {
                        const current = userForm.body_types || [];
                        const updated = current.includes(type) 
                            ? current.filter(t => t !== type) 
                            : [...current, type];
                        setUserForm({...userForm, body_types: updated});
                      }}>
                        <Checkbox id={`body-${type}`} checked={userForm.body_types?.includes(type)} />
                        <label htmlFor={`body-${type}`} className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fuel Types */}
                <div className="space-y-3">
                  <Label>Engine Preference</Label>
                  <ToggleGroup type="multiple" variant="outline" value={userForm.fuel_types} onValueChange={(val) => setUserForm({...userForm, fuel_types: val})}>
                    {FUEL_TYPES.map((fuel) => (
                        <ToggleGroupItem key={fuel} value={fuel} className="flex-1">
                            {fuel}
                        </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Usage & Timeframe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label>Primary Usage</Label>
                        <Select onValueChange={(val: any) => setUserForm({...userForm, usage_goal: val})}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select usage..." />
                            </SelectTrigger>
                            <SelectContent>
                                {USAGE_GOALS.map((goal) => (
                                    <SelectItem key={goal.value} value={goal.value}>
                                        <div className="flex items-center gap-2">
                                            <Icon icon={goal.icon} />
                                            {goal.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Purchase Timeframe</Label>
                        <Select onValueChange={(val: any) => setUserForm({...userForm, purchase_timeframe: val})}>
                            <SelectTrigger>
                                <SelectValue placeholder="When do you plan to buy?" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="immediate">Immediately</SelectItem>
                                <SelectItem value="1-3_months">1-3 Months</SelectItem>
                                <SelectItem value="3-6_months">3-6 Months</SelectItem>
                                <SelectItem value="planning">Just Looking / Planning</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleUserSubmit} disabled={isLoading}>
                    {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
                    Complete Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* DEALER ONBOARDING */}
          <TabsContent value="dealer">
            <Card>
              <CardHeader>
                <CardTitle>Dealer Registration</CardTitle>
                <CardDescription>Verify your business to start selling on Project X.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input 
                            placeholder="e.g. Auto Kings LLC" 
                            value={dealerForm.business_name}
                            onChange={(e) => setDealerForm({...dealerForm, business_name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tax ID / EIN</Label>
                        <Input 
                            placeholder="XX-XXXXXXX" 
                            value={dealerForm.tax_id}
                            onChange={(e) => setDealerForm({...dealerForm, tax_id: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>License Number</Label>
                        <Input 
                            placeholder="Dealer License #" 
                            value={dealerForm.license_number}
                            onChange={(e) => setDealerForm({...dealerForm, license_number: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Inventory Size</Label>
                        <Select onValueChange={(val: any) => setDealerForm({...dealerForm, inventory_size: val})}>
                            <SelectTrigger>
                                <SelectValue placeholder="Monthly Sales Volume" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0-10">0-10 Vehicles</SelectItem>
                                <SelectItem value="10-50">10-50 Vehicles</SelectItem>
                                <SelectItem value="50+">50+ Vehicles</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Inventory Feed URL (Optional)</Label>
                    <Input 
                        placeholder="https://example.com/feed.csv" 
                        value={dealerForm.feed_url}
                        onChange={(e) => setDealerForm({...dealerForm, feed_url: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">We support CSV, XML, and JSON feeds.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleDealerSubmit} disabled={isLoading}>
                    {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
                    Create Dealer Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* COMPANY ONBOARDING */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Logistics Partner Setup</CardTitle>
                <CardDescription>Configure your services and pricing to receive quote requests.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                        placeholder="Logistics Pro Inc." 
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Base Service Fee ($)</Label>
                        <Input 
                            type="number" 
                            placeholder="0" 
                            value={companyForm.base_price}
                            onChange={(e) => setCompanyForm({...companyForm, base_price: Number(e.target.value)})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Price Per Mile ($)</Label>
                        <Input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            value={companyForm.price_per_mile}
                            onChange={(e) => setCompanyForm({...companyForm, price_per_mile: Number(e.target.value)})}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Services Provided</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Ocean Freight', 'Inland Trucking', 'Customs Clearance', 'Insurance', 'Parts Shipping'].map((svc) => (
                            <div key={svc} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`svc-${svc}`} 
                                    checked={companyForm.services?.includes(svc)}
                                    onCheckedChange={(checked) => {
                                        const current = companyForm.services || [];
                                        if (checked) {
                                            setCompanyForm({...companyForm, services: [...current, svc]});
                                        } else {
                                            setCompanyForm({...companyForm, services: current.filter(s => s !== svc)});
                                        }
                                    }}
                                />
                                <label htmlFor={`svc-${svc}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {svc}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input 
                        placeholder="+1 ..." 
                        value={companyForm.phone_number}
                        onChange={(e) => setCompanyForm({...companyForm, phone_number: e.target.value})}
                    />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCompanySubmit} disabled={isLoading}>
                    {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
                    Activate Service Provider
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OnboardingPage;

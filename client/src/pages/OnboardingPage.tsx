import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserForm } from './onboarding/components/UserForm';
import { DealerForm } from './onboarding/components/DealerForm';
import { CompanyForm } from './onboarding/components/CompanyForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from "sonner";

const OnboardingPage = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate fetching initial user state or checking session
    // In a real app, we might fetch user role preference here
    const timer = setTimeout(() => {
        setIsInitializing(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveForLater = () => {
      // The data is already in sessionStorage thanks to useOnboardingForm hooks.
      // This button just gives visual feedback.
      toast.success("Progress saved! You can continue later.");
  };

  if (isInitializing) {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
             <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
             </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Project X</h1>
                <p className="text-muted-foreground">Let's customize your experience based on your role.</p>
            </div>
            <Button variant="outline" onClick={handleSaveForLater} className="hidden sm:flex">
                <Icon icon="mdi:content-save-outline" className="mr-2" />
                Save for Later
            </Button>
        </div>

        {/* Role Switcher / Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <TabsTrigger value="user" className="py-3 flex flex-col gap-1">
                    <Icon icon="mdi:account" className="h-5 w-5" />
                    <span>I'm a Buyer</span>
                    </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Find cars to buy</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <TabsTrigger value="dealer" className="py-3 flex flex-col gap-1">
                    <Icon icon="mdi:store" className="h-5 w-5" />
                    <span>I'm a Dealer</span>
                    </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Sell cars and manage inventory</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <TabsTrigger value="company" className="py-3 flex flex-col gap-1">
                    <Icon icon="mdi:truck-fast" className="h-5 w-5" />
                    <span>Logistics</span>
                    </TabsTrigger>
                </TooltipTrigger>
                 <TooltipContent><p>Provide shipping and services</p></TooltipContent>
            </Tooltip>
          </TabsList>

          {/* USER ONBOARDING */}
          <TabsContent value="user" className="mt-6">
            <UserForm />
          </TabsContent>

          {/* DEALER ONBOARDING */}
          <TabsContent value="dealer" className="mt-6">
            <DealerForm />
          </TabsContent>

          {/* COMPANY ONBOARDING */}
          <TabsContent value="company" className="mt-6">
            <CompanyForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OnboardingPage;

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Icon } from "@iconify/react"
import { BODY_TYPES, FUEL_TYPES, USAGE_GOALS } from "@/constants/onboarding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useOnboardingForm } from "@/hooks/useOnboardingForm"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export function UserForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const userFormSchema = z.object({
    budget_min: z.coerce.number().optional(),
    budget_max: z.coerce.number().optional(),
    body_types: z.array(z.string()).optional(),
    fuel_types: z.array(z.string()).optional(),
    usage_goal: z.enum(['commute', 'family', 'resale', 'fun', 'other']).optional(),
    purchase_timeframe: z.enum(['immediate', '1-3_months', '3-6_months', 'planning']).optional(),
  })

  type UserFormValues = z.infer<typeof userFormSchema>

  const { form, triggerConfetti } = useOnboardingForm<UserFormValues>('user', {
    // Cast to any to avoid resolver generic mismatch while still enforcing runtime schema
    resolver: zodResolver(userFormSchema) as any,
    defaultValues: {
      budget_min: 5000,
      budget_max: 25000,
      body_types: [],
      fuel_types: [],
    },
  })

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)
    try {
      // No API call for user onboarding for now; this is a local no-op submit.
      console.log('[UserOnboarding] Local submit payload (no API call yet)', data)
      toast.success(t('onboarding.user.success'))
      triggerConfetti()
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (error) {
      toast.error(t('onboarding.user.failure'))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => setStep(2)
  const prevStep = () => setStep(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('onboarding.user.title')}</CardTitle>
        <CardDescription>
            {t('onboarding.user.step_indicator', { 
                current: step, 
                total: 2, 
                label: step === 1 ? t('onboarding.user.steps.budget_type') : t('onboarding.user.steps.usage_goals') 
            })}
        </CardDescription>
        {/* Simple Progress Bar */}
        <div className="w-full h-2 bg-secondary rounded-full mt-2">
            <div 
                className="h-full bg-primary rounded-full transition-all duration-300" 
                style={{ width: `${(step / 2) * 100}%` }}
            />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    {/* Budget Section */}
                    <div className="space-y-4">
                    <FormLabel>{t('onboarding.user.budget_range')}</FormLabel>
                    <div className="flex items-center gap-4">
                        <FormField
                        control={form.control}
                        name="budget_min"
                        render={({ field }) => (
                            <FormItem className="w-24">
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Slider
                        min={0}
                        max={100000}
                        step={1000}
                        value={[form.watch("budget_min") ?? 0, form.watch("budget_max") ?? 0]}
                        onValueChange={(vals) => {
                            form.setValue("budget_min", vals[0])
                            form.setValue("budget_max", vals[1])
                        }}
                        className="flex-1"
                        />
                        <FormField
                        control={form.control}
                        name="budget_max"
                        render={({ field }) => (
                            <FormItem className="w-24">
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    {form.formState.errors.budget_max?.message && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.budget_max.message}</p>
                    )}
                    </div>

                    {/* Body Types */}
                    <FormField
                    control={form.control}
                    name="body_types"
                    render={() => (
                        <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">{t('onboarding.user.body_types')}</FormLabel>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {BODY_TYPES.map((type) => (
                            <FormField
                                key={type}
                                control={form.control}
                                name="body_types"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={type}
                                    className={cn(
                                        "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2 cursor-pointer transition-colors",
                                        field.value?.includes(type) ? "bg-primary/10 border-primary" : "hover:bg-accent"
                                    )}
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(type)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), type])
                                            : field.onChange(
                                                field.value?.filter(
                                                    (value) => value !== type
                                                )
                                                )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer w-full">
                                        {type}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    {/* Fuel Types */}
                    <FormField
                        control={form.control}
                        name="fuel_types"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('onboarding.user.engine_pref')}</FormLabel>
                                <FormControl>
                                    <ToggleGroup 
                                        type="multiple" 
                                        variant="outline" 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                    >
                                        {FUEL_TYPES.map((fuel) => (
                                            <ToggleGroupItem key={fuel} value={fuel} className="flex-1">
                                                {fuel}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Usage Goal */}
                        <FormField
                            control={form.control}
                            name="usage_goal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('onboarding.user.usage')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('onboarding.placeholders.usage')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {USAGE_GOALS.map((goal) => (
                                                <SelectItem key={goal.value} value={goal.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon icon={goal.icon} />
                                                        {t(`onboarding.user.goals.${goal.value}`)}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Purchase Timeframe */}
                        <FormField
                            control={form.control}
                            name="purchase_timeframe"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('onboarding.user.purchase_time')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('onboarding.placeholders.buying_time')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="immediate">{t('onboarding.user.timeframes.immediate')}</SelectItem>
                                            <SelectItem value="1-3_months">{t('onboarding.user.timeframes.1-3_months')}</SelectItem>
                                            <SelectItem value="3-6_months">{t('onboarding.user.timeframes.3-6_months')}</SelectItem>
                                            <SelectItem value="planning">{t('onboarding.user.timeframes.planning')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            )}

            <CardFooter className="flex justify-between px-0 pt-4">
                {step === 1 ? (
                    <Button type="button" onClick={nextStep} className="w-full">
                        {t('onboarding.user.next')} <Icon icon="mdi:arrow-right" className="ml-2" />
                    </Button>
                ) : (
                    <div className="flex gap-4 w-full">
                        <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                            {t('onboarding.user.back')}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                            {isLoading ? <Icon icon="mdi:loading" className="animate-spin mr-2" /> : null}
                            {t('onboarding.user.submit')}
                        </Button>
                    </div>
                )}
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

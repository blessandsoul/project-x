import { useReducer, useState, type FormEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react/dist/iconify.js'

type LeadFormState = {
  name: string
  contact: string
  budget: string
  message: string
  consent: boolean
}

type LeadFormAction =
  | { type: 'SET_FIELD'; field: keyof LeadFormState; value: string | boolean }
  | { type: 'RESET' }

const initialState: LeadFormState = {
  name: '',
  contact: '',
  budget: '',
  message: '',
  consent: false,
}

function leadFormReducer(state: LeadFormState, action: LeadFormAction): LeadFormState {
  if (action.type === 'RESET') {
    return initialState
  }

  if (action.type === 'SET_FIELD') {
    if (action.field === 'consent') {
      return {
        ...state,
        consent: Boolean(action.value),
      }
    }

    return {
      ...state,
      [action.field]: String(action.value ?? ''),
    }
  }

  return state
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export function LeadCaptureSection() {
  const shouldReduceMotion = useReducedMotion()
  const [state, dispatch] = useReducer(leadFormReducer, initialState)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormState, string>>>({})

  const defaultSectionMotionProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  } as const

  const reducedSectionMotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  } as const

  const sectionMotionProps = shouldReduceMotion
    ? reducedSectionMotionProps
    : defaultSectionMotionProps

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof LeadFormState, string>> = {}

    if (!state.name.trim()) {
      nextErrors.name = 'გთხოვთ შეიყვანოთ სახელი'
    }

    if (!state.contact.trim()) {
      nextErrors.contact = 'გთხოვთ მიუთითოთ ტელეფონი ან Telegram'
    }

    if (!state.consent) {
      nextErrors.consent = 'აუცილებელია დათანხმება პირობებზე'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setStatus('submitting')

    setTimeout(() => {
      setStatus('success')
      dispatch({ type: 'RESET' })
      setErrors({})
    }, 600)
  }

  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'

  return (
    <motion.section
      {...sectionMotionProps}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="border-b bg-background"
      aria-labelledby="home-lead-form-heading"
      role="region"
    >
      <div className="container mx-auto py-10">
        <div className="grid gap-8 md:grid-cols-[1.5fr,1fr] md:items-center">
          <div className="space-y-4">
            <h2
              id="home-lead-form-heading"
              className="text-2xl font-semibold tracking-tight md:text-3xl"
            >
              მიიღეთ პირადი რეკომენდაცია კომპანიების შესახებ
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              შეავსეთ მოკლე ფორმა და მიიღეთ შერჩეული კომპანიების სია, რომლებიც
              შეესაბამება თქვენს ბიუჯეტსა და მოთხოვნებს.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clock-fast" className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>პასუხი დაახლოებით 1 სამუშაო დღეში</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:lock-outline" className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>თქვენი კონტაქტი არ გადაეცემა მესამე მხარეებს</span>
              </div>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Icon
                  icon="mdi:account-question-outline"
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <span>სწრაფი განაცხადი</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-1">
                  <Label htmlFor="lead-name" className="text-xs text-muted-foreground">
                    სახელი
                  </Label>
                  <Input
                    id="lead-name"
                    name="name"
                    value={state.name}
                    onChange={(event) =>
                      dispatch({ type: 'SET_FIELD', field: 'name', value: event.target.value })
                    }
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'lead-name-error' : undefined}
                  />
                  {errors.name ? (
                    <p id="lead-name-error" className="text-xs text-destructive">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lead-contact" className="text-xs text-muted-foreground">
                    ტელეფონი ან Telegram
                  </Label>
                  <Input
                    id="lead-contact"
                    name="contact"
                    value={state.contact}
                    onChange={(event) =>
                      dispatch({ type: 'SET_FIELD', field: 'contact', value: event.target.value })
                    }
                    placeholder="მაგ: +995 5XX XX XX XX ან @username"
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? 'lead-contact-error' : undefined}
                  />
                  {errors.contact ? (
                    <p id="lead-contact-error" className="text-xs text-destructive">
                      {errors.contact}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lead-budget" className="text-xs text-muted-foreground">
                    სასურველი ბიუჯეტი, USD (არასავალდებულო)
                  </Label>
                  <Input
                    id="lead-budget"
                    name="budget"
                    type="number"
                    min={0}
                    value={state.budget}
                    onChange={(event) =>
                      dispatch({ type: 'SET_FIELD', field: 'budget', value: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lead-message" className="text-xs text-muted-foreground">
                    დამატებითი ინფორმაცია (არასავალდებულო)
                  </Label>
                  <Input
                    id="lead-message"
                    name="message"
                    value={state.message}
                    onChange={(event) =>
                      dispatch({ type: 'SET_FIELD', field: 'message', value: event.target.value })
                    }
                    placeholder="მაგ: მინდა SUV ოჯახისთვის ან მაინტერესებს პრემიუმ სედანი"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="lead-consent"
                    checked={state.consent}
                    onCheckedChange={(value) =>
                      dispatch({ type: 'SET_FIELD', field: 'consent', value: Boolean(value) })
                    }
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={errors.consent ? 'lead-consent-error' : undefined}
                  />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <Label htmlFor="lead-consent" className="cursor-pointer text-xs">
                      ვეთანხმები დაკავშირებას და პირადი მონაცემების დამუშავებას სერვისის
                      ფარგლებში
                    </Label>
                    {errors.consent ? (
                      <p id="lead-consent-error" className="text-xs text-destructive">
                        {errors.consent}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  motionVariant="scale"
                >
                  {isSubmitting ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      იგზავნება...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:send" className="mr-2 h-4 w-4" aria-hidden="true" />
                      გაგზავნა განაცხადის
                    </>
                  )}
                </Button>

                {isSuccess ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <Icon icon="mdi:check-circle" className="h-4 w-4" aria-hidden="true" />
                    <span>განაცხადი მიღებულია, მალე დაგიკავშირდებით.</span>
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.section>
  )
}

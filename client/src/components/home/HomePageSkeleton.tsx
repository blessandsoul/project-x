import { motion, useReducedMotion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export const HomePageSkeleton = () => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <main
      className="flex-1 bg-background"
      role="main"
      aria-busy="true"
      aria-label="იტვირთება მთავარი გვერდი"
    >
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-10 md:py-16 space-y-10 md:space-y-12">
        <p
          className="text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          ვიტვირთებით...
        </p>
        <motion.div
          className="grid gap-10 md:grid-cols-2 md:items-center"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="space-y-6">
            <Skeleton className="inline-flex h-6 w-40 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-9 w-3/4 rounded-md md:h-12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-36 rounded-md" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-sm space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.08 }}
        >
          <div className="border-b bg-background">
            <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
              <div className="shadow-sm rounded-lg border bg-card p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <div className="grid gap-4 md:grid-cols-5 md:items-end">
                  <div className="space-y-2 md:col-span-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.16 }}
        >
          <div className="border-b bg-muted/10">
            <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

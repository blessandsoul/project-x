import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Icon } from '@iconify/react/dist/iconify.js'
import { mockCompanies } from '@/mocks/_mockData'

interface Testimonial {
  id: string
  userName: string
  rating: number
  comment: string
}

export function TestimonialsSection() {
  const testimonials = useMemo<Testimonial[]>(() => {
    const all = mockCompanies.flatMap((company) =>
      company.reviews.map((review) => ({
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
      })),
    )
    return all.slice(0, 3)
  }, [])

  if (testimonials.length === 0) return null

  return (
    <section
      className="border-b bg-muted/20"
      aria-labelledby="home-testimonials-heading"
    >
      <div className="container mx-auto py-10 md:py-12">
        <div className="mb-6">
          <h2
            id="home-testimonials-heading"
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            კლიენტების შეფასებები
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            რეალური გამოცდილება იმპორტის პროცესიდან.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item, index) => {
            const avatarImages = [
              '/avatars/user.jpg',
              '/avatars/dealer.jpg',
              '/avatars/0450249b131eec36dc8333b7cf847bc4.webp',
            ]
            const avatarSrc = avatarImages[index % avatarImages.length]
            const initials = item.userName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)

            return (
              <Card key={item.id} className="h-full border-muted/60">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarSrc} alt={item.userName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold">
                        {item.userName}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon
                            key={star}
                            icon="mdi:star"
                            className={`h-3 w-3 ${
                              star <= item.rating ? 'text-yellow-400' : 'text-muted-foreground/30'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.comment}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

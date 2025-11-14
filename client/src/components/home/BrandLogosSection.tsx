import { Card, CardContent } from '@/components/ui/card'

const BRAND_LOGOS = [
  { id: 1, name: 'BMW', src: '/car-logos/bmw.png' },
  { id: 2, name: 'Mercedes-Benz', src: '/car-logos/mercedes-benz.png' },
  { id: 3, name: 'Toyota', src: '/car-logos/toyota.png' },
  { id: 4, name: 'Lexus', src: '/car-logos/lexus.png' },
  { id: 5, name: 'Ford', src: '/car-logos/ford.png' },
  { id: 6, name: 'Chevrolet', src: '/car-logos/chevrolet.png' },
]

export function BrandLogosSection() {
  return (
    <section
      className="border-b bg-muted/20"
      aria-labelledby="home-brands-heading"
    >
      <div className="container mx-auto py-8 md:py-10">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-brands-heading"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            >
              ბრენდები, რომლებსაც ხშირად იღებენ ამერიკიდან
            </h2>
          </div>
        </div>

        <Card className="border-muted/60 bg-background/80">
          <CardContent className="flex flex-wrap items-center justify-center gap-6 py-6">
            {BRAND_LOGOS.map((brand) => (
              <div
                key={brand.id}
                className="flex h-10 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
              >
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="max-h-10 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

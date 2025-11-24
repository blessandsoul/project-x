import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

// Components
import Header from '@/components/Header/index.tsx'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Hooks & Utils
import { useVehicleDetails } from '@/hooks/useVehicleDetails'
import { cn } from '@/lib/utils'
import type { VehicleQuote } from '@/types/vehicles'
import { createLeadFromQuotes } from '@/api/leads'
import { navigationItems, footerLinks } from '@/config/navigation'

// --- Sub-components ---

const VehicleGallery = ({ photos }: { photos: any[] }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!photos.length) {
    return <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">No Photos Available</div>
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm group">
        <img
          src={photos[activeIndex].url}
          alt="Vehicle"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
          {activeIndex + 1} / {photos.length}
        </div>
        
        {/* Navigation Arrows (Desktop) */}
        <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev > 0 ? prev - 1 : photos.length - 1) }}
                className="bg-white/90 p-1.5 rounded-full shadow-md hover:bg-white text-black"
            >
                <Icon icon="mdi:chevron-left" className="h-5 w-5" />
            </button>
        </div>
        <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev < photos.length - 1 ? prev + 1 : 0) }}
                className="bg-white/90 p-1.5 rounded-full shadow-md hover:bg-white text-black"
            >
                <Icon icon="mdi:chevron-right" className="h-5 w-5" />
            </button>
        </div>
      </div>

      {/* Thumbnails Strip */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {photos.map((photo, idx) => (
            <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                "relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 snap-start transition-all",
                activeIndex === idx 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
            >
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
            ))}
        </div>
      </div>
    </div>
  )
}

const VehicleSpecs = ({ vehicle }: { vehicle: any }) => {
  if (!vehicle) return null

  const specs = [
    { icon: 'mdi:engine', label: 'Engine', value: vehicle.engine_volume ? `${vehicle.engine_volume}L` : 'N/A' },
    { icon: 'mdi:car-shift-pattern', label: 'Transmission', value: vehicle.transmission || 'Automatic' },
    { icon: 'mdi:car-traction-control', label: 'Drive', value: vehicle.drive || 'FWD' },
    { icon: 'mdi:counter', label: 'Mileage', value: `${vehicle.mileage?.toLocaleString() || '0'} mi` },
    { icon: 'mdi:calendar', label: 'Year', value: vehicle.year },
    { icon: 'mdi:gas-station', label: 'Fuel', value: vehicle.engine_fuel || 'Gasoline' },
    { icon: 'mdi:barcode', label: 'VIN', value: vehicle.vin, copy: true },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {specs.map((spec, idx) => (
        <div key={idx} className="flex flex-col p-3 bg-muted/40 hover:bg-muted/60 transition-colors rounded-xl border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Icon icon={spec.icon} className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{spec.label}</span>
          </div>
          <div className="font-semibold text-sm truncate flex items-center gap-2">
            {spec.value}
            {spec.copy && (
              <button 
                onClick={() => {
                    navigator.clipboard.writeText(String(spec.value))
                    // Optional: Add toast here
                }}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                title="Copy VIN"
              >
                <Icon icon="mdi:content-copy" className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const QuoteRow = ({ quote, onSelect, isBestPrice }: { quote: VehicleQuote; onSelect: () => void; isBestPrice?: boolean }) => {
  const totalPrice = Number(quote.total_price) || 0
  const rating = 4.8 // Mock rating
  const reviews = 120 // Mock reviews

  return (
    <TableRow className={cn("group cursor-pointer hover:bg-muted/50", isBestPrice && "bg-muted/30")}>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{quote.company_name}</span>
            {isBestPrice && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">Best Price</Badge>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center text-amber-500">
                <Icon icon="mdi:star" className="h-3 w-3 fill-current" />
                <span className="ml-0.5 font-medium text-foreground">{rating}</span>
            </div>
            <span className="text-muted-foreground/60">•</span>
            <span>{reviews} reviews</span>
            <span className="ml-1 inline-flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                <Icon icon="mdi:check-decagram" className="h-3 w-3" />
                Verified
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm">
          <span className="font-medium">{quote.delivery_time_days || '45-60'} days</span>
          <span className="text-xs text-muted-foreground">Sea + Land to Poti</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className={cn("font-bold text-lg", isBestPrice ? "text-primary" : "text-foreground")}>
            ${totalPrice.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">All inclusive</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button 
            size="sm" 
            variant={isBestPrice ? "default" : "outline"}
            onClick={onSelect}
            className={cn("transition-all", isBestPrice && "shadow-md")}
        >
            {isBestPrice ? 'Select Deal' : 'Details'}
        </Button>
      </TableCell>
    </TableRow>
  )
}

// --- Main Page Component ---

const VehicleDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicle, photos, quotes, isLoading } = useVehicleDetails(id ? Number(id) : null)

  // Modal State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<VehicleQuote | null>(null)
  
  // Lead Form State
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [contactMethod, setContactMethod] = useState('whatsapp')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find best quote (cheapest)
  const bestQuote = useMemo(() => {
    if (!quotes.length) return null
    return [...quotes].sort((a, b) => (Number(a.total_price) || 0) - (Number(b.total_price) || 0))[0]
  }, [quotes])

  const handleQuoteSelect = (quote: VehicleQuote) => {
    setSelectedQuote(quote)
    setIsLeadModalOpen(true)
  }

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote || !id) return

    setIsSubmitting(true)
    try {
       await createLeadFromQuotes({
         vehicleId: Number(id),
         selectedCompanyIds: [selectedQuote.company_id],
         name: formName,
         contact: formPhone,
         message: `Interested in this vehicle. Please contact me via ${contactMethod}.`,
         priority: 'price',
         preferredContactChannel: contactMethod as any
       })
       setIsLeadModalOpen(false)
       alert("Request sent successfully! The importer will contact you shortly.")
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      alert("Failed to send request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={navigationItems} />
        <main className="container mx-auto p-6 space-y-8">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={navigationItems} />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <h1 className="text-2xl font-bold">Vehicle not found</h1>
          <Button onClick={() => navigate('/catalog')}>Back to Catalog</Button>
        </div>
      </div>
    )
  }

  // Calculate prices safely handling nulls
  const auctionPrice = Number(vehicle.buy_it_now_price || vehicle.final_bid || 0)
  const shippingPrice = bestQuote ? (Number(bestQuote.breakdown?.shipping_total) || 1200) : 0
  const customsPrice = bestQuote ? (Number(bestQuote.breakdown?.customs_fee) || 500) : 0
  const brokerFee = bestQuote ? (Number(bestQuote.breakdown?.broker_fee) || 300) : 300
  const totalPrice = bestQuote ? (Number(bestQuote.total_price)) : (auctionPrice + shippingPrice + customsPrice + brokerFee)

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Header user={null} navigationItems={navigationItems} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-hidden">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors shrink-0">Home</button>
          <Icon icon="mdi:chevron-right" className="h-4 w-4 mx-1 shrink-0" />
          <button onClick={() => navigate('/catalog')} className="hover:text-primary transition-colors shrink-0">Vehicles</button>
          <Icon icon="mdi:chevron-right" className="h-4 w-4 mx-1 shrink-0" />
          <span className="text-foreground font-medium truncate">{vehicle.year} {vehicle.make} {vehicle.model}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Gallery & Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="outline" className="uppercase tracking-wider text-[10px]">Lot: {vehicle.source_lot_id}</Badge>
                {vehicle.is_new && <Badge className="bg-blue-600">New Arrival</Badge>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon icon="mdi:map-marker" className="h-4 w-4 text-primary" />
                  {vehicle.city || vehicle.state || 'USA Auction'}
                </span>
                <span className="flex items-center gap-1">
                  <Icon icon="mdi:calendar-clock" className="h-4 w-4" />
                  Sale Date: {vehicle.sold_at_date || 'Upcoming'}
                </span>
              </div>
            </div>

            <VehicleGallery photos={photos} />

            <VehicleSpecs vehicle={vehicle} />

            {/* Transparency Section: Comparison Table */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden" id="quotes-table">
              <div className="p-6 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="mdi:compare" className="text-primary h-5 w-5" />
                    Verified Import Offers
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                    We found {quotes.length} trusted companies ready to import this vehicle.
                    </p>
                </div>
                {/* Optional: Sort controls could go here */}
              </div>
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Company</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                        <TableHead className="text-right w-[120px]">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {quotes.map((quote, idx) => (
                        <QuoteRow 
                        key={idx} 
                        quote={quote} 
                        isBestPrice={bestQuote?.company_id === quote.company_id}
                        onSelect={() => handleQuoteSelect(quote)} 
                        />
                    ))}
                    {quotes.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <p>Calculating best rates for you...</p>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Price Card */}
          <div className="lg:col-span-1 sticky top-24 space-y-4">
            <Card className="shadow-lg border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start">
                    <CardDescription className="uppercase text-xs font-bold text-muted-foreground tracking-wider">
                    Estimated Total Cost
                    </CardDescription>
                    <Badge variant="outline" className="bg-background text-[10px] font-normal">
                        USD / GEL
                    </Badge>
                </div>
                <CardTitle className="text-4xl font-bold text-foreground flex items-baseline gap-2">
                  ${totalPrice.toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground hidden sm:inline-block">USD</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  ≈ {(totalPrice * 2.7).toLocaleString()} GEL
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-dashed group hover:bg-muted/50 px-1 -mx-1 rounded transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Icon icon="mdi:gavel" className="h-4 w-4 opacity-70" />
                        Auction Price (Est.)
                    </span>
                    <span className="font-medium">${auctionPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed group hover:bg-muted/50 px-1 -mx-1 rounded transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Icon icon="mdi:ship-wheel" className="h-4 w-4 opacity-70" />
                        Shipping (USA → GE)
                    </span>
                    <span className="font-medium">${shippingPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed group hover:bg-muted/50 px-1 -mx-1 rounded transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Icon icon="mdi:file-document-check" className="h-4 w-4 opacity-70" />
                        Customs & Excise
                    </span>
                    <span className="font-medium">${customsPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 px-1 -mx-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Icon icon="mdi:handshake" className="h-4 w-4 opacity-70" />
                        Service Fees
                    </span>
                    <span className="font-medium">${brokerFee}</span>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 items-start text-blue-900 text-xs">
                  <Icon icon="mdi:shield-check" className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800">Price Guarantee</p>
                    <p className="opacity-90 leading-relaxed">
                        The price you see includes all standard fees. No hidden charges upon arrival in Poti.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                    onClick={() => bestQuote && handleQuoteSelect(bestQuote)}
                  >
                    Order This Vehicle
                  </Button>
                  <Button variant="outline" className="w-full h-12 border-primary/20 text-primary hover:bg-primary/5 font-medium">
                    <Icon icon="mdi:whatsapp" className="mr-2 h-5 w-5" />
                    Ask a Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dealer Info Mini Card */}
            {bestQuote && (
              <div className="bg-card rounded-xl border p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuoteSelect(bestQuote)}>
                 <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                    {bestQuote.company_name.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Offer From</p>
                   <p className="font-bold text-base truncate">{bestQuote.company_name}</p>
                 </div>
                 <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-100">
                      <Icon icon="mdi:star" className="h-3 w-3 text-amber-500" />
                      <span>4.8</span>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-area-bottom">
        <div>
           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Est.</p>
           <p className="text-xl font-extrabold text-primary leading-none">${totalPrice.toLocaleString()}</p>
        </div>
        <Button onClick={() => bestQuote && handleQuoteSelect(bestQuote)} size="lg" className="shadow-lg font-bold px-8">
           Order Now
        </Button>
      </div>

      {/* Lead Modal */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Vehicle Order</DialogTitle>
            <DialogDescription>
              Send a request to <span className="font-semibold text-foreground">{selectedQuote?.company_name}</span>. They will contact you to confirm details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLead} className="space-y-4 py-2">
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input 
                        id="name" 
                        placeholder="John Doe" 
                        value={formName} 
                        onChange={(e) => setFormName(e.target.value)} 
                        required
                        className="h-10"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                        id="phone" 
                        placeholder="+995 555 00 00 00" 
                        value={formPhone} 
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                        className="h-10"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
                    <div className="flex gap-4">
                        <div 
                            onClick={() => setContactMethod('whatsapp')}
                            className={cn("flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-muted/50 transition-all", contactMethod === 'whatsapp' ? "border-primary bg-primary/5 ring-1 ring-primary" : "")}
                        >
                            <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", contactMethod === 'whatsapp' ? "bg-primary text-primary-foreground" : "bg-transparent")}>
                                {contactMethod === 'whatsapp' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-medium flex items-center gap-2">
                                <Icon icon="mdi:whatsapp" className="h-4 w-4 text-green-600" />
                                WhatsApp
                            </span>
                        </div>
                        <div 
                            onClick={() => setContactMethod('phone')}
                            className={cn("flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-muted/50 transition-all", contactMethod === 'phone' ? "border-primary bg-primary/5 ring-1 ring-primary" : "")}
                        >
                             <div className={cn("h-4 w-4 rounded-full border border-primary flex items-center justify-center", contactMethod === 'phone' ? "bg-primary text-primary-foreground" : "bg-transparent")}>
                                {contactMethod === 'phone' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-medium flex items-center gap-2">
                                <Icon icon="mdi:phone" className="h-4 w-4 text-blue-600" />
                                Phone
                            </span>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-muted/30 p-4 rounded-lg border text-xs space-y-1.5 mt-4">
               <div className="flex justify-between">
                   <span className="text-muted-foreground">Vehicle:</span>
                   <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
               </div>
               <div className="flex justify-between">
                   <span className="text-muted-foreground">Importer:</span>
                   <span className="font-medium">{selectedQuote?.company_name}</span>
               </div>
               <div className="flex justify-between border-t border-dashed pt-1.5 mt-1.5">
                   <span className="font-semibold">Total Estimate:</span>
                   <span className="font-bold text-primary">${Number(selectedQuote?.total_price)?.toLocaleString()}</span>
               </div>
             </div>
             
             <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={isSubmitting}>
               {isSubmitting ? (
                 <>
                    <Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                 </>
               ) : (
                 'Send Order Request'
               )}
             </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer footerLinks={footerLinks} />
    </div>
  )
}

export default VehicleDetailsPage

export interface Testimonial {
  id: string
  userName: string
  avatarUrl: string | null
  rating: number
  comment: string
  companyName: string
  purchasedCar?: {
    model: string
    year: number
    image: string
  }
  clientStats?: {
    since: number
    orders: number
  }
}

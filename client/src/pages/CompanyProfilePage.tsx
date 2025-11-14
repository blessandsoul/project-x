import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react/dist/iconify.js';
import { mockNavigationItems, mockFooterLinks, mockCompanies } from '@/mocks/_mockData';

const CompanyProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const company = mockCompanies.find(c => c.id === id);

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={mockNavigationItems} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <Icon icon="mdi:alert-circle" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">კომპანია არ მოიძებნა</h2>
            <p className="text-muted-foreground mb-4">მოთხოვნილი კომპანია არ არსებობს</p>
            <Button onClick={() => navigate('/catalog')}>დაბრუნება კატალოგში</Button>
          </Card>
        </main>
        <Footer footerLinks={mockFooterLinks} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />

      <main className="flex-1" role="main">
        <div className="container mx-auto py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/catalog')}
              className="mb-4"
            >
              <Icon icon="mdi:arrow-left" className="mr-2 h-4 w-4" />
              დაბრუნება
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              <img
                src={company.logo}
                alt={company.name}
                className="w-24 h-24 rounded-xl object-cover mb-4 lg:mb-0"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{company.name}</h1>
                  {company.vipStatus && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      <Icon icon="mdi:crown" className="mr-1 h-3 w-3" />
                      VIP
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    <Icon icon="mdi:star" className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold ml-1">{company.rating}</span>
                    <span className="text-muted-foreground ml-1">
                      ({company.reviewCount} შეფასება)
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Icon icon="mdi:map-marker" className="h-4 w-4 mr-1" />
                    {company.location.city}, {company.location.state}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Icon icon="mdi:calendar" className="h-4 w-4 mr-1" />
                    დაფუძნებული {company.establishedYear}
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 max-w-3xl">
                  {company.description}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg">
                    <Icon icon="mdi:phone" className="mr-2 h-4 w-4" />
                    დაკავშირება
                  </Button>
                  <Button variant="outline" size="lg">
                    <Icon icon="mdi:email" className="mr-2 h-4 w-4" />
                    მეილი
                  </Button>
                  <Button variant="outline" size="lg">
                    <Icon icon="mdi:web" className="mr-2 h-4 w-4" />
                    ვებ-საიტი
                  </Button>
                </div>
              </div>

              <div className="lg:text-right mt-6 lg:mt-0">
                <div className="text-2xl font-bold text-primary mb-1">
                  ${company.priceRange.min} - ${company.priceRange.max}
                </div>
                <p className="text-sm text-muted-foreground">სერვისის ღირებულება</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>მომსახურება</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.services.map(service => (
                      <div key={service} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Icon icon="mdi:check-circle" className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>შეფასებები ({company.reviews.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.reviews.map(review => (
                    <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.userName}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Icon
                                key={i}
                                icon="mdi:star"
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>საკონტაქტო ინფორმაცია</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:phone" className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{company.contact.phone}</p>
                      <p className="text-sm text-muted-foreground">ტელეფონი</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:email" className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{company.contact.email}</p>
                      <p className="text-sm text-muted-foreground">ელ. ფოსტა</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:web" className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{company.contact.website}</p>
                      <p className="text-sm text-muted-foreground">ვებ-საიტი</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>სტატისტიკა</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">რეიტინგი</span>
                    <span className="font-medium">{company.rating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">შეფასებები</span>
                    <span className="font-medium">{company.reviewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">დაფუძნებული</span>
                    <span className="font-medium">{company.establishedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">მომსახურება</span>
                    <span className="font-medium">{company.services.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">დაინტერესებული ხართ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    დაუკავშირდით კომპანიას დეტალების გასაგებად
                  </p>
                  <Button className="w-full">
                    <Icon icon="mdi:send" className="mr-2 h-4 w-4" />
                    გაგზავნა შეტყობინება
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default CompanyProfilePage;

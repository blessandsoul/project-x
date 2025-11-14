import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react/dist/iconify.js';
import { mockNavigationItems, mockFooterLinks, mockCompanies } from '@/mocks/_mockData';

const CompanyCatalogPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const companies = mockCompanies;

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.location.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price-low':
        return a.priceRange.min - b.priceRange.min;
      case 'price-high':
        return b.priceRange.max - a.priceRange.max;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />

      <main className="flex-1" role="main">
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">კატალოგი იმპორტის კომპანიების</h1>
            <p className="text-muted-foreground">გაეცანით ყველა ხელმისაწვდომ კომპანიას</p>
          </div>

          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="მოძებნეთ კომპანიები..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="დალაგება" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">რეიტინგით</SelectItem>
                <SelectItem value="price-low">ფასი (დაბალი)</SelectItem>
                <SelectItem value="price-high">ფასი (მაღალი)</SelectItem>
                <SelectItem value="name">სახელით</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate('/search')}>
              <Icon icon="mdi:filter-variant" className="mr-2 h-4 w-4" />
              დამატებითი ფილტრები
            </Button>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              ნაჩვენებია {sortedCompanies.length} კომპანია {companies.length}-დან
            </p>
          </div>

          {/* Company Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedCompanies.map(company => (
              <Card key={company.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => navigate(`/company/${company.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    {company.vipStatus && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                        VIP
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-tight">{company.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Rating */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Icon icon="mdi:star" className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium ml-1">{company.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({company.reviewCount})
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icon icon="mdi:map-marker" className="h-4 w-4 mr-1" />
                      {company.location.city}, {company.location.state}
                    </div>

                    {/* Price Range */}
                    <div className="flex items-center text-sm">
                      <Icon icon="mdi:cash" className="h-4 w-4 mr-1 text-green-600" />
                      <span className="font-medium">
                        ${company.priceRange.min} - ${company.priceRange.max}
                      </span>
                    </div>

                    {/* Services Preview */}
                    <div className="flex flex-wrap gap-1">
                      {company.services.slice(0, 2).map(service => (
                        <span
                          key={service}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md"
                        >
                          {service}
                        </span>
                      ))}
                      {company.services.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{company.services.length - 2} მეტი
                        </span>
                      )}
                    </div>

                    {/* Established Year */}
                    <div className="text-xs text-muted-foreground">
                      დაფუძნებული: {company.establishedYear}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedCompanies.length === 0 && (
            <Card className="p-12 text-center">
              <Icon icon="mdi:magnify-remove" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">კომპანიები არ მოიძებნა</h3>
              <p className="text-muted-foreground mb-6">
                სცადეთ სხვა საძიებო სიტყვები ან გაასუფთავეთ ფილტრები
              </p>
              <Button onClick={() => setSearchTerm('')}>
                გაასუფთავეთ საძიებო
              </Button>
            </Card>
          )}
        </div>
      </main>

      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default CompanyCatalogPage;

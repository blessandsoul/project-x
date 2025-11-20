import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompanyRating } from '@/components/company/CompanyRating';
import { VipBadge } from '@/components/company/VipBadge';
import { EmptyState } from '@/components/company/EmptyState';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react/dist/iconify.js';
import { mockNavigationItems, mockFooterLinks, mockCompanies, mockCars } from '@/mocks/_mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useCompaniesData } from '@/hooks/useCompaniesData';
import { useQuotesSearch } from '@/hooks/useQuotesSearch';
import { useAuth } from '@/hooks/useAuth';
import { fetchCompanyReviewsFromApi, createCompanyReviewFromApi, updateCompanyReviewFromApi, deleteCompanyReviewFromApi, type ApiCompanyReview } from '@/services/companiesApi';

const CompanyProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { companies, isLoading } = useCompaniesData();
  const company = companies.find((c) => c.id === id) ?? mockCompanies.find((c) => c.id === id);
  const companyCars = mockCars.filter((car) => car.companyId === (company?.id ?? ''));
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [quotePrice, setQuotePrice] = useState<number>(20000);
  const [quoteDistance, setQuoteDistance] = useState<number>(5500);
  const { quotes, isLoading: isQuotesLoading, error: quotesError, searchQuotes } = useQuotesSearch();
  const [reviews, setReviews] = useState<ApiCompanyReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState<number>(1);
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState('');
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const reviewsLimit = 5;
  const { user } = useAuth();

  useEffect(() => {
    if (company?.id) {
      addRecentlyViewed(company.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) {
      return;
    }

    let isCancelled = false;

    const loadReviews = async () => {
      setIsReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await fetchCompanyReviewsFromApi(company.id, {
          limit: reviewsLimit,
          offset: (reviewsPage - 1) * reviewsLimit,
        });

        if (isCancelled) {
          return;
        }

        setReviews(Array.isArray(response.items) ? response.items : []);
        setReviewsTotalPages(
          typeof response.totalPages === 'number' && response.totalPages > 0
            ? response.totalPages
            : 1,
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error('[CompanyProfilePage] Failed to load company reviews', {
          companyId: company.id,
          error,
        });
        setReviewsError('ვერ ჩატარდა შეფასებების ჩატვირთვა');
      } finally {
        if (!isCancelled) {
          setIsReviewsLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      isCancelled = true;
    };
  }, [company?.id, reviewsLimit, reviewsPage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const priceParam = params.get('price');
    if (priceParam !== null) {
      const parsed = Number(priceParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        setQuotePrice(parsed);
      }
    }

    const distanceParam = params.get('distance');
    if (distanceParam !== null) {
      const parsed = Number(distanceParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        setQuoteDistance(parsed);
      }
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (quotePrice && quotePrice > 0) {
      params.set('price', String(quotePrice));
    } else {
      params.delete('price');
    }

    if (quoteDistance && quoteDistance > 0) {
      params.set('distance', String(quoteDistance));
    } else {
      params.delete('distance');
    }

    const search = params.toString();

    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      },
      { replace: true },
    );
  }, [quotePrice, quoteDistance, location.pathname, location.search, navigate]);

  const handleSubmitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company || isSubmittingContact) {
      return;
    }

    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      return;
    }

    setIsSubmittingContact(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsContactOpen(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company || isSubmittingReview || reviewRating < 1 || reviewRating > 5) {
      return;
    }

    if (reviewComment.trim() && reviewComment.trim().length < 10) {
      setReviewSubmitError('შეფასება უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს');
      return;
    }

    setIsSubmittingReview(true);
    setReviewSubmitError(null);

    try {
      await createCompanyReviewFromApi({
        company_id: Number(company.id),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      // Reset form
      setReviewRating(5);
      setReviewComment('');
      setIsReviewFormOpen(false);

      // Refresh reviews
      const response = await fetchCompanyReviewsFromApi(company.id, {
        limit: reviewsLimit,
        offset: (reviewsPage - 1) * reviewsLimit,
      });

      setReviews(Array.isArray(response.items) ? response.items : []);
      setReviewsTotalPages(
        typeof response.totalPages === 'number' && response.totalPages > 0
          ? response.totalPages
          : 1,
      );
    } catch (error) {
      console.error('[CompanyProfilePage] Failed to submit review', {
        companyId: company.id,
        error,
      });
      setReviewSubmitError('შეფასების გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleStartEditReview = (review: ApiCompanyReview) => {
    setEditingReviewId(String(review.id));
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleUpdateReview = async (reviewId: string) => {
    if (!company || isUpdatingReview) {
      return;
    }

    if (editComment.trim() && editComment.trim().length < 10) {
      // Можно добавить ошибку валидации здесь
      return;
    }

    setIsUpdatingReview(true);

    try {
      await updateCompanyReviewFromApi(company.id, reviewId, {
        rating: editRating,
        comment: editComment.trim() || null,
      });

      // Reset edit state
      setEditingReviewId(null);
      setEditRating(5);
      setEditComment('');

      // Refresh reviews
      const response = await fetchCompanyReviewsFromApi(company.id, {
        limit: reviewsLimit,
        offset: (reviewsPage - 1) * reviewsLimit,
      });

      setReviews(Array.isArray(response.items) ? response.items : []);
      setReviewsTotalPages(
        typeof response.totalPages === 'number' && response.totalPages > 0
          ? response.totalPages
          : 1,
      );
    } catch (error) {
      console.error('[CompanyProfilePage] Failed to update review', {
        companyId: company.id,
        reviewId,
        error,
      });
      // Можно добавить показ ошибки пользователю
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!company || isDeletingReview || !confirm('დარწმუნებული ხართ, რომ გსურთ შეფასების წაშლა?')) {
      return;
    }

    setIsDeletingReview(true);

    try {
      await deleteCompanyReviewFromApi(company.id, reviewId);

      // Refresh reviews
      const response = await fetchCompanyReviewsFromApi(company.id, {
        limit: reviewsLimit,
        offset: (reviewsPage - 1) * reviewsLimit,
      });

      setReviews(Array.isArray(response.items) ? response.items : []);
      setReviewsTotalPages(
        typeof response.totalPages === 'number' && response.totalPages > 0
          ? response.totalPages
          : 1,
      );
    } catch (error) {
      console.error('[CompanyProfilePage] Failed to delete review', {
        companyId: company.id,
        reviewId,
        error,
      });
      // Можно добавить показ ошибки пользователю
    } finally {
      setIsDeletingReview(false);
    }
  };

  const isReviewOwner = (review: ApiCompanyReview): boolean => {
    return user ? Number(user.id) === review.user_id : false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={mockNavigationItems} />
        <main className="flex-1 flex items-center justify-center" aria-busy="true">
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </main>
        <Footer footerLinks={mockFooterLinks} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={mockNavigationItems} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8">
            <EmptyState
              icon="mdi:alert-circle"
              title="კომპანია არ მოიძებნა"
              description="მოთხოვნილი კომპანია არ არსებობს"
              action={(
                <Button onClick={() => navigate('/catalog')}>
                  დაბრუნება კატალოგში
                </Button>
              )}
            />
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
              {company.logo && (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-24 h-24 rounded-xl object-cover mb-4 lg:mb-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{company.name}</h1>
                  {company.vipStatus && <VipBadge />}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full ml-2"
                    onClick={() => toggleFavorite(company.id)}
                    aria-pressed={favorites.includes(company.id)}
                    aria-label={favorites.includes(company.id) ? 'საყვარელი სიიდან ამოღება' : 'დამატება რჩეულებში'}
                  >
                    <Icon
                      icon={favorites.includes(company.id) ? 'mdi:heart' : 'mdi:heart-outline'}
                      className={favorites.includes(company.id) ? 'h-4 w-4 text-red-500' : 'h-4 w-4 text-muted-foreground'}
                    />
                  </Button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    <CompanyRating rating={company.rating} size="md" />
                    <span className="text-muted-foreground ml-2">
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
                  <Sheet open={isContactOpen} onOpenChange={setIsContactOpen}>
                    <Button
                      size="lg"
                      onClick={() => setIsContactOpen(true)}
                    >
                      <Icon icon="mdi:phone" className="mr-2 h-4 w-4" />
                      დაკავშირება
                    </Button>
                    <SheetContent side="right" aria-label="კომპანიასთან დაკავშირება">
                      <SheetHeader>
                        <SheetTitle>კომპანიასთან დაკავშირება</SheetTitle>
                        <SheetDescription>
                          შეავსეთ ფორმა, რათა გადაგიგზავნოთ შეკითხვა კომპანიას {company.name}.
                        </SheetDescription>
                      </SheetHeader>
                      <form
                        className="flex flex-col gap-4 p-4 pt-0"
                        onSubmit={handleSubmitContact}
                      >
                        <div className="space-y-1">
                          <Label htmlFor="contact-name">თქვენი სახელი</Label>
                          <Input
                            id="contact-name"
                            type="text"
                            value={contactName}
                            onChange={(event) => setContactName(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="contact-email">ელ. ფოსტა</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactEmail}
                            onChange={(event) => setContactEmail(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="contact-message">შეტყობინება</Label>
                          <textarea
                            id="contact-message"
                            value={contactMessage}
                            onChange={(event) => setContactMessage(event.target.value)}
                            required
                            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <SheetFooter>
                          <Button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="w-full"
                          >
                            {isSubmittingContact && (
                              <Icon
                                icon="mdi:loading"
                                className="mr-2 h-4 w-4 animate-spin"
                              />
                            )}
                            გაგზავნა
                          </Button>
                        </SheetFooter>
                      </form>
                    </SheetContent>
                  </Sheet>
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
                        <Icon icon="mdi:check-circle" className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {companyCars.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>იმპორტირებული ავტომობილების მაგალითები</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {companyCars.slice(0, 4).map((car) => (
                        <div
                          key={car.id}
                          className="flex gap-3 rounded-lg border bg-muted/40 p-3"
                        >
                          {car.imageUrl && (
                            <img
                              src={car.imageUrl}
                              alt={`${car.make} ${car.model}`}
                              className="h-16 w-24 rounded-md object-cover"
                            />
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {car.year} {car.make} {car.model}
                              </p>
                              <span className="text-xs font-medium text-primary">
                                ${car.price.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {car.bodyType} • {car.fuelType} • {car.transmission}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              გარბენი: {car.mileage.toLocaleString()} km
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>შეფასებები ({company.reviewCount})</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                      className="flex items-center gap-2"
                    >
                      <Icon icon="mdi:plus" className="h-4 w-4" />
                      დაწერე შეფასება
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Review Form */}
                  {isReviewFormOpen && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="pt-6">
                        <form className="space-y-4" onSubmit={handleSubmitReview}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="review-comment">თქვენი შეფასება</Label>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none focus:ring-2 focus:ring-primary rounded hover:scale-110 transition-transform"
                                    onClick={() => setReviewRating(star)}
                                    aria-label={`შეფასება ${star} ვარსკვლავი`}
                                  >
                                    <Icon
                                      icon="mdi:star"
                                      className={`h-5 w-5 ${
                                        star <= reviewRating
                                          ? 'text-warning fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {reviewRating} / 5
                                </span>
                              </div>
                            </div>
                            <textarea
                              id="review-comment"
                              value={reviewComment}
                              onChange={(event) => setReviewComment(event.target.value)}
                              placeholder="გთხოვთ მოგვიყევით თქვენი გამოცდილების შესახებ..."
                              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              required
                            />
                          </div>

                          {reviewSubmitError && (
                            <p className="text-sm text-red-500">{reviewSubmitError}</p>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isSubmittingReview}
                              className="flex items-center gap-2"
                            >
                              {isSubmittingReview && (
                                <Icon
                                  icon="mdi:loading"
                                  className="h-4 w-4 animate-spin"
                                />
                              )}
                              გაგზავნა
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsReviewFormOpen(false);
                                setReviewRating(5);
                                setReviewComment('');
                                setReviewSubmitError(null);
                              }}
                              disabled={isSubmittingReview}
                            >
                              გაუქმება
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  <div className={`space-y-4 ${isReviewFormOpen ? 'mt-6' : ''}`}>
                    {isReviewsLoading && (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-4 w-24 rounded bg-muted" />
                            <div className="h-3 w-16 rounded bg-muted" />
                          </div>
                          <div className="h-3 w-full rounded bg-muted" />
                          <div className="h-3 w-5/6 rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isReviewsLoading && reviewsError && (
                    <p className="text-sm text-red-500">
                      {reviewsError}
                    </p>
                  )}

                  {!isReviewsLoading && !reviewsError && reviews.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      ამ კომპანიას ჯერ არ აქვს შეფასებები.
                    </p>
                  )}

                  {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={`review-${review.id}-${review.created_at}`} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                მომხმარებელი #{review.user_id}
                              </span>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, index) => (
                                  <Icon
                                    key={index}
                                    icon="mdi:star"
                                    className={`h-4 w-4 ${
                                      index < review.rating ? 'text-warning fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isReviewOwner(review) && (
                                <div className="flex items-center gap-1">
                                  {editingReviewId === String(review.id) ? (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateReview(String(review.id))}
                                        disabled={isUpdatingReview}
                                        className="h-6 px-2 text-xs"
                                      >
                                        {isUpdatingReview && (
                                          <Icon icon="mdi:loading" className="h-3 w-3 animate-spin mr-1" />
                                        )}
                                        შენახვა
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEditReview}
                                        disabled={isUpdatingReview}
                                        className="h-6 px-2 text-xs"
                                      >
                                        გაუქმება
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEditReview(review)}
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        <Icon icon="mdi:pencil" className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteReview(String(review.id))}
                                        disabled={isDeletingReview}
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500"
                                      >
                                        <Icon icon="mdi:delete" className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {editingReviewId === String(review.id) ? (
                            <div className="mt-3 space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">შეფასება</Label>
                                <div className="flex items-center space-x-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                                      onClick={() => setEditRating(star)}
                                      aria-label={`შეფასება ${star} ვარსკვლავი`}
                                    >
                                      <Icon
                                        icon="mdi:star"
                                        className={`h-5 w-5 ${
                                          star <= editRating
                                            ? 'text-warning fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {editRating} / 5
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`edit-comment-${review.id}`}>კომენტარი</Label>
                                <textarea
                                  id={`edit-comment-${review.id}`}
                                  value={editComment}
                                  onChange={(event) => setEditComment(event.target.value)}
                                  placeholder="გთხოვთ მოგვიყევით თქვენი გამოცდილების შესახებ..."
                                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                              </div>
                            </div>
                          ) : (
                            review.comment && (
                              <p className="text-sm text-muted-foreground">
                                {review.comment}
                              </p>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {reviewsTotalPages > 1 && !reviewsError && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isReviewsLoading || reviewsPage <= 1}
                        onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                      >
                        <Icon icon="mdi:chevron-left" className="h-4 w-4 mr-1" />
                        წინა
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {reviewsPage} / {reviewsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isReviewsLoading || reviewsPage >= reviewsTotalPages}
                        onClick={() => setReviewsPage((prev) => Math.min(reviewsTotalPages, prev + 1))}
                      >
                        შემდეგი
                        <Icon icon="mdi:chevron-right" className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                  </div>
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

              {/* Quote Calculator (draft) */}
              <Card>
                <CardHeader>
                  <CardTitle>ფასის გამოთვლა (დრაფტი)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quote-price">ავტომობილის ფასი (USD)</Label>
                    <Input
                      id="quote-price"
                      type="number"
                      value={quotePrice}
                      onChange={(event) => setQuotePrice(Number(event.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quote-distance">დაშორება მილიებში</Label>
                    <Input
                      id="quote-distance"
                      type="number"
                      value={quoteDistance}
                      onChange={(event) => setQuoteDistance(Number(event.target.value) || 0)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={isQuotesLoading}
                    onClick={() => {
                      if (!company) return;
                      void searchQuotes({
                        vehicle: {
                          vin: null,
                          price: quotePrice,
                          distance_miles: quoteDistance,
                        },
                        filters: {
                          min_company_rating: 0,
                          max_total_price: null,
                        },
                      });
                    }}
                  >
                    {isQuotesLoading && (
                      <Icon
                        icon="mdi:loading"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    )}
                    გამოთვალე ფასი
                  </Button>

                  {quotesError && (
                    <p className="text-sm text-red-500 mt-2">{quotesError}</p>
                  )}

                  {quotes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {quotes.map((quote) => (
                        <div
                          key={quote.company.id}
                          className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                        >
                          <span className="font-medium">{quote.company.name}</span>
                          <span className="font-semibold">${quote.total_price}</span>
                        </div>
                      ))}
                    </div>
                  )}
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

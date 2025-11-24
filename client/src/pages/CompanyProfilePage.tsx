import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompanyRating } from '@/components/company/CompanyRating';
import { VipBadge } from '@/components/company/VipBadge';
import { EmptyState } from '@/components/company/EmptyState';
import { Icon } from '@iconify/react/dist/iconify.js';
import { navigationItems, footerLinks } from '@/config/navigation';
import { mockCompanies, mockCars } from '@/mocks/_mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useCompaniesData } from '@/hooks/useCompaniesData';
import { useAuth } from '@/hooks/useAuth';
import { fetchCompanyReviewsFromApi, createCompanyReviewFromApi, updateCompanyReviewFromApi, deleteCompanyReviewFromApi, type ApiCompanyReview } from '@/services/companiesApi';

const CompanyProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { companies, isLoading } = useCompaniesData();

  const numericId = id ? Number(id) : NaN;
  const company =
    companies.find((c) => c.id === numericId) ??
    mockCompanies.find((c) => String(c.id) === id);
  const companyCars = mockCars.filter((car) => car.companyId === (company?.id ?? ''));
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
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
  const { user, userRole } = useAuth();

  const canWriteReviews = userRole === 'user' || userRole === 'dealer';

  useEffect(() => {
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  useEffect(() => {
    if (company?.id) {
      addRecentlyViewed(String(company.id));
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
        setReviewsError(t('company_profile.error.reviews_load'));
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
  }, [company?.id, reviewsLimit, reviewsPage, t]);


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
    if (!company || !canWriteReviews || isSubmittingReview || reviewRating < 1 || reviewRating > 5) {
      return;
    }

    if (reviewComment.trim() && reviewComment.trim().length < 10) {
      setReviewSubmitError(t('company_profile.error.review_length'));
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
      setReviewSubmitError(t('company_profile.error.review_submit'));
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
    if (!company || !canWriteReviews || isUpdatingReview) {
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
    if (!company || !canWriteReviews || isDeletingReview || !confirm(t('company_profile.reviews.delete_confirm'))) {
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
    if (!user || !(userRole === 'user' || userRole === 'dealer')) {
      return false;
    }
    return Number(user.id) === review.user_id;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={navigationItems} />
        <main className="flex-1 flex items-center justify-center" aria-busy="true">
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </Card>
        </main>
        <Footer footerLinks={footerLinks} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} navigationItems={navigationItems} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8">
            <EmptyState
              icon="mdi:alert-circle"
              title={t('company_profile.not_found.title')}
              description={t('company_profile.not_found.description')}
              action={(
                <Button onClick={() => navigate('/catalog')}>
                  {t('company_profile.not_found.back_to_catalog')}
                </Button>
              )}
            />
          </Card>
        </main>
        <Footer footerLinks={footerLinks} />
      </div>
    );
  }

  const logoSrc = company.logo ?? '';
  const hasHighTrustScore = Boolean((company as any)?.trustScore && (company as any).trustScore >= 70);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={navigationItems}
      />

      <main className="flex-1" role="main">
        <div className="container mx-auto py-8 px-4 sm:px-6">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/catalog')}
              className="mb-4"
            >
              <Icon icon="mdi:arrow-left" className="me-2 h-4 w-4" />
              {t('company_profile.back')}
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8 rtl:space-x-reverse">
              {logoSrc && (
                <div className="relative mb-4 lg:mb-0 w-full lg:w-auto">
                  <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden lg:w-28 lg:h-28 lg:aspect-auto">
                    <img
                      src={logoSrc}
                      alt={company.name}
                      className="h-full w-full object-cover rounded-2xl lg:w-24 lg:h-24 lg:rounded-xl"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                    <Icon icon="mdi:check-circle" className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2 rtl:space-x-reverse">
                  <h1 className="text-3xl font-bold">{company.name}</h1>
                  {hasHighTrustScore && <VipBadge />}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full ms-2"
                    onClick={() => toggleFavorite(String(company.id))}
                    aria-pressed={favorites.includes(String(company.id))}
                    aria-label={favorites.includes(String(company.id)) ? t('company_profile.favorites.remove') : t('company_profile.favorites.add')}
                  >
                    <Icon
                      icon={favorites.includes(String(company.id)) ? 'mdi:heart' : 'mdi:heart-outline'}
                      className={favorites.includes(String(company.id)) ? 'h-4 w-4 text-red-500' : 'h-4 w-4 text-muted-foreground'}
                    />
                  </Button>
                </div>

                <div className="flex flex-col gap-2 mb-4 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 rtl:space-x-reverse">
                  <div className="flex items-center">
                    <CompanyRating rating={company.rating} size="md" />
                    <span className="ms-2">
                      ({company.reviewCount} {t('company_profile.reviews_count')})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:map-marker" className="h-4 w-4 me-1" />
                    <span>
                      {company.location?.city ?? ''}
                      {company.location?.city && company.location?.state ? ', ' : ''}
                      {company.location?.state ?? ''}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:calendar" className="h-4 w-4 me-1" />
                    <span>
                      {t('company_profile.founded')} {company.establishedYear}
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6 max-w-3xl">
                  {company.description}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                    <Button
                      size="lg"
                      onClick={() => setIsContactOpen(true)}
                    >
                      <Icon icon="mdi:phone" className="me-2 h-4 w-4" />
                      {t('company_profile.contact_btn')}
                    </Button>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{t('company_profile.contact.title')}</DialogTitle>
                        <DialogDescription>
                          {t('company_profile.contact.description', { name: company.name })}
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSubmitContact}
                      >
                        <div className="space-y-1">
                          <Label htmlFor="contact-name">{t('company_profile.contact.name')}</Label>
                          <Input
                            id="contact-name"
                            type="text"
                            value={contactName}
                            onChange={(event) => setContactName(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="contact-email">{t('company_profile.contact.email')}</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactEmail}
                            onChange={(event) => setContactEmail(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="contact-message">{t('company_profile.contact.message')}</Label>
                          <textarea
                            id="contact-message"
                            value={contactMessage}
                            onChange={(event) => setContactMessage(event.target.value)}
                            required
                            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="w-full"
                          >
                            {isSubmittingContact && (
                              <Icon
                                icon="mdi:loading"
                                className="me-2 h-4 w-4 animate-spin"
                              />
                            )}
                            {t('company_profile.contact.submit')}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="lg">
                    <Icon icon="mdi:email" className="me-2 h-4 w-4" />
                    {t('company_profile.email_btn')}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Icon icon="mdi:web" className="me-2 h-4 w-4" />
                    {t('company_profile.website_btn')}
                  </Button>
                </div>
              </div>

              {company.priceRange && (
                <div className="lg:text-right mt-6 lg:mt-0">
                  <div
                    className="text-2xl font-bold text-primary mb-1"
                    aria-label={`Estimated service cost from ${company.priceRange.min} to ${company.priceRange.max} USD`}
                  >
                    ${company.priceRange.min.toLocaleString()} - ${company.priceRange.max.toLocaleString()}
                  </div>
                  <p
                    className="text-xs text-muted-foreground"
                    aria-label="Approximate total service cost in Georgian lari"
                  >
                    ≈ {(company.priceRange.min * 2.7).toLocaleString()} GEL
                  </p>
                  <p className="text-sm text-muted-foreground">{t('company_profile.service_cost')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('company_profile.services.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(company.services ?? []).map(service => (
                      <div key={service} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg rtl:space-x-reverse">
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
                    <CardTitle>{t('company_profile.cars.title')}</CardTitle>
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
                              {t('company_profile.cars.mileage')}: {car.mileage.toLocaleString()} km
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
                    <CardTitle>{t('company_profile.reviews.title')} ({company.reviewCount})</CardTitle>
                    {canWriteReviews && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                        className="flex items-center gap-2"
                      >
                        <Icon icon="mdi:plus" className="h-4 w-4" />
                        {t('company_profile.reviews.write')}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Review Form */}
                  {canWriteReviews && isReviewFormOpen && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="pt-6">
                        <form className="space-y-4" onSubmit={handleSubmitReview}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="review-comment">{t('company_profile.reviews.your_rating')}</Label>
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none focus:ring-2 focus:ring-primary rounded hover:scale-110 transition-transform"
                                    onClick={() => setReviewRating(star)}
                                    aria-label={`${star} stars`}
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
                                <span className="ms-2 text-sm text-muted-foreground">
                                  {reviewRating} / 5
                                </span>
                              </div>
                            </div>
                            <textarea
                              id="review-comment"
                              value={reviewComment}
                              onChange={(event) => setReviewComment(event.target.value)}
                              placeholder={t('company_profile.reviews.comment_placeholder')}
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
                              {t('company_profile.reviews.submit')}
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
                              {t('company_profile.reviews.cancel')}
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
                      {t('company_profile.reviews.empty')}
                    </p>
                  )}

                  {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={`review-${review.id}-${review.created_at}`} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              {review.avatar && review.avatar.trim().length > 0 && (
                                <img
                                  src={review.avatar}
                                  alt={review.user_name || `${t('common.user')} #${review.user_id}`}
                                  className="h-8 w-8 rounded-full object-cover border border-muted"
                                />
                              )}
                              <span className="font-medium">
                                {review.user_name && review.user_name.trim().length > 0
                                  ? review.user_name
                                  : `${t('common.user')} #${review.user_id}`}
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
                                          <Icon icon="mdi:loading" className="h-3 w-3 animate-spin me-1" />
                                        )}
                                        {t('common.save')}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEditReview}
                                        disabled={isUpdatingReview}
                                        className="h-6 px-2 text-xs"
                                      >
                                        {t('common.cancel')}
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
                                <Label className="text-sm font-medium">{t('company_profile.reviews.your_rating')}</Label>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                                      onClick={() => setEditRating(star)}
                                      aria-label={`${star} stars`}
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
                                  <span className="ms-2 text-sm text-muted-foreground">
                                    {editRating} / 5
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`edit-comment-${review.id}`}>{t('company_profile.reviews.comment_label')}</Label>
                                <textarea
                                  id={`edit-comment-${review.id}`}
                                  value={editComment}
                                  onChange={(event) => setEditComment(event.target.value)}
                                  placeholder={t('company_profile.reviews.comment_placeholder')}
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
                        <Icon icon="mdi:chevron-left" className="h-4 w-4 me-1" />
                        {t('company_profile.reviews.prev')}
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
                        {t('company_profile.reviews.next')}
                        <Icon icon="mdi:chevron-right" className="h-4 w-4 ms-1" />
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
                  <CardTitle>{t('company_profile.contact_info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.contact?.phone && (
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Icon icon="mdi:phone" className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{company.contact.phone}</p>
                      </div>
                    </div>
                  )}
                  {company.contact?.email && (
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Icon icon="mdi:email" className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{company.contact.email}</p>
                      </div>
                    </div>
                  )}
                  {company.contact?.website && (
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Icon icon="mdi:web" className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{company.contact.website}</p>
                      </div>
                    </div>
                  )}

                  {/* Social Networks - Icon Only */}
                  <div className="pt-6 border-t mt-4">
                    <div className="flex items-center justify-center gap-6">
                      <a
                        href="#"
                        title="Facebook"
                        aria-label="Facebook"
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Icon icon="mdi:facebook" className="h-5 w-5 text-primary" />
                      </a>
                      <a
                        href="#"
                        title="Instagram"
                        aria-label="Instagram"
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Icon icon="mdi:instagram" className="h-5 w-5 text-primary" />
                      </a>
                      <a
                        href="#"
                        title="LinkedIn"
                        aria-label="LinkedIn"
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Icon icon="mdi:linkedin" className="h-5 w-5 text-primary" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('company_profile.stats.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Rating */}
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
                      <Icon icon="mdi:star" className="h-6 w-6 text-warning fill-current mb-2" />
                      <span className="text-xl font-bold">{company.rating}</span>
                      <p className="text-xs text-muted-foreground mt-1">{t('company_profile.stats.rating')}</p>
                    </div>

                    {/* Reviews */}
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
                      <Icon icon="mdi:chat" className="h-6 w-6 text-primary mb-2" />
                      <span className="text-xl font-bold">{company.reviewCount}</span>
                      <p className="text-xs text-muted-foreground mt-1">{t('company_profile.stats.reviews')}</p>
                    </div>

                    {/* Year */}
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
                      <Icon icon="mdi:calendar" className="h-6 w-6 text-secondary mb-2" />
                      <span className="text-xl font-bold">{company.establishedYear}</span>
                      <p className="text-xs text-muted-foreground mt-1">{t('company_profile.stats.founded')}</p>
                    </div>

                    {/* Services */}
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 text-center">
                      <Icon icon="mdi:briefcase" className="h-6 w-6 text-success mb-2" />
                      <span className="text-xl font-bold">{company.services?.length ?? 0}</span>
                      <p className="text-xs text-muted-foreground mt-1">{t('company_profile.stats.services')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{t('company_profile.cta.title')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('company_profile.cta.description')}
                  </p>
                  <Button className="w-full">
                    <Icon icon="mdi:send" className="me-2 h-4 w-4" />
                    {t('company_profile.cta.button')}
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
        <div className="hidden dev-note mt-8 p-4 text-xs text-muted-foreground">
          <p>
            This page focuses on one decision: whether to work with this company. It shows the expected
            service cost range, highlights rating and reviews, and provides clear contact actions.
          </p>
        </div>
      </main>

      <Footer footerLinks={footerLinks} />
    </div>
  );
};

export default CompanyProfilePage;

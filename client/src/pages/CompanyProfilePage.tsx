import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/formatDate';
import ColorThief from 'colorthief';
// Header and Footer are provided by MainLayout
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompanyRating } from '@/components/company/CompanyRating';
import { VipBadge } from '@/components/company/VipBadge';
import { EmptyState } from '@/components/company/EmptyState';
import { Icon } from '@iconify/react/dist/iconify.js';
// navigationItems/footerLinks now handled by MainLayout
import { mockCars } from '@/mocks/_mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/hooks/useAuth';
import { fetchCompanyByIdFromApi, fetchCompanyReviewsFromApi, createCompanyReviewFromApi, updateCompanyReviewFromApi, deleteCompanyReviewFromApi, type ApiCompanyReview } from '@/services/companiesApi';
import type { Company } from '@/types/api';

const CompanyProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { addRecentlyViewed } = useRecentlyViewed();
  
  // Fetch company by ID directly (not from cached list)
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetchCompanyByIdFromApi(id)
      .then((data) => {
        if (!isCancelled) {
          setCompany(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('[CompanyProfilePage] Failed to load company', err);
          setLoadError('Failed to load company');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);
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
  const [gradientColors, setGradientColors] = useState<string[]>([]);
  const reviewsLimit = 5;
  const { user, userRole } = useAuth();

  const logoSrc = company?.logo ?? '';
  const hasHighTrustScore = Boolean((company as any)?.trustScore && (company as any).trustScore >= 70);

  const canWriteReviews = userRole === 'user' || userRole === 'dealer';

  // Extract colors from company logo for gradient background
  useEffect(() => {
    if (!logoSrc) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = logoSrc;

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 3);
        if (palette && palette.length > 0) {
          const colors = palette.map((rgb: number[]) => `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`);
          setGradientColors(colors);
        }
      } catch (e) {
        console.warn('Failed to extract colors from logo', e);
      }
    };
  }, [logoSrc]);

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
      <div className="flex-1 flex items-center justify-center bg-slate-50" aria-busy="true">
        <Card className="p-8 border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Card className="p-8 border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon="mdi:alert-circle"
            title={t('company_profile.not_found.title')}
            description={t('company_profile.not_found.description')}
            action={(
              <Button onClick={() => navigate('/catalog')} className="bg-slate-900 hover:bg-slate-800 text-white">
                {t('company_profile.not_found.back_to_catalog')}
              </Button>
            )}
          />
        </Card>
      </div>
    );
  }

  // Generate gradient style from extracted colors
  const gradientStyle = gradientColors.length >= 2
    ? {
        background: `linear-gradient(135deg, 
          rgba(${gradientColors[0]}, 0.15) 0%, 
          rgba(${gradientColors[1]}, 0.1) 50%, 
          rgba(${gradientColors[2] || gradientColors[0]}, 0.05) 100%)`,
      }
    : {};

  return (
    <div className="flex-1 flex flex-col relative min-h-screen">
      {/* Full-page gradient background from logo colors */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={gradientStyle}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden z-10">

        {/* Hero Content */}
        <div className="relative z-10">
          <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] mx-auto pt-6 pb-8 lg:pt-8 lg:pb-10">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/catalog')}
              className="mb-6 text-slate-700 hover:text-slate-900 hover:bg-white/50"
            >
              <Icon icon="mdi:arrow-left" className="me-2 h-4 w-4" />
              {t('company_profile.back')}
            </Button>

            <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-8 text-center lg:text-start">
              {/* Company Logo */}
              {logoSrc && (
                <div className="relative mb-6 lg:mb-0 flex-shrink-0">
                  <div className="w-28 h-28 lg:w-32 lg:h-32 mx-auto lg:mx-0 rounded-2xl border-2 border-white bg-white p-2 shadow-lg">
                    <img
                      src={logoSrc}
                      alt={company.name}
                      className="h-full w-full object-contain rounded-xl"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 lg:left-auto lg:-right-2 lg:translate-x-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <Icon icon="mdi:check-bold" className="h-4 w-4 text-slate-900" />
                  </div>
                </div>
              )}

              <div className="flex-1 w-full">
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 mb-4">
                  <div>
                    {/* Company Name & Actions */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{company.name}</h1>
                      {hasHighTrustScore && <VipBadge />}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full flex-shrink-0 border-slate-300 bg-white/80 hover:bg-white"
                        onClick={() => toggleFavorite(String(company.id))}
                        aria-pressed={favorites.includes(String(company.id))}
                        aria-label={favorites.includes(String(company.id)) ? t('company_profile.favorites.remove') : t('company_profile.favorites.add')}
                      >
                        <Icon
                          icon={favorites.includes(String(company.id)) ? 'mdi:heart' : 'mdi:heart-outline'}
                          className={favorites.includes(String(company.id)) ? 'h-4 w-4 text-red-500' : 'h-4 w-4 text-slate-500'}
                        />
                      </Button>
                    </div>

                    {/* Meta Info Badges */}
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2 text-sm mb-4">
                      <div className="flex items-center bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <CompanyRating rating={company.rating} size="sm" />
                        <span className="ms-1.5 text-slate-600 font-medium">
                          ({company.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-slate-700">
                        <Icon icon="mdi:map-marker" className="h-4 w-4 me-1.5 text-slate-500" />
                        <span>
                          {company.location?.city ?? ''}
                          {company.location?.city && company.location?.state ? ', ' : ''}
                          {company.location?.state ?? ''}
                        </span>
                      </div>
                      <div className="flex items-center bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-slate-700">
                        <Icon icon="mdi:calendar" className="h-4 w-4 me-1.5 text-slate-500" />
                        <span>
                          {t('company_profile.founded')} {company.establishedYear}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                      {company.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row flex-wrap justify-center lg:justify-start gap-3 w-full lg:w-auto">
                  <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                    <Button
                      size="lg"
                      onClick={() => setIsContactOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                    >
                      <Icon icon="mdi:phone" className="me-2 h-5 w-5" />
                      {t('company_profile.contact_btn')}
                    </Button>
                    <DialogContent className="sm:max-w-[420px]">
                      {/* Header Icon */}
                      <div className="flex justify-center -mt-2 mb-2">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800/10 to-slate-600/10 flex items-center justify-center shadow-sm">
                          <Icon icon="mdi:message-text" className="h-7 w-7 text-slate-700" />
                        </div>
                      </div>
                      
                      <DialogHeader>
                        <DialogTitle>{t('company_profile.contact.title')}</DialogTitle>
                        <DialogDescription>
                          {t('company_profile.contact.description', { name: company.name })}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form
                        className="space-y-5"
                        onSubmit={handleSubmitContact}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('company_profile.contact.name')}
                          </Label>
                          <Input
                            id="contact-name"
                            type="text"
                            value={contactName}
                            onChange={(event) => setContactName(event.target.value)}
                            required
                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-base placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('company_profile.contact.email')}
                          </Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactEmail}
                            onChange={(event) => setContactEmail(event.target.value)}
                            required
                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-base placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('company_profile.contact.message')}
                          </Label>
                          <textarea
                            id="contact-message"
                            value={contactMessage}
                            onChange={(event) => setContactMessage(event.target.value)}
                            required
                            className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="w-full h-12 rounded-xl font-bold text-base bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/25"
                          >
                            {isSubmittingContact ? (
                              <span className="flex items-center gap-2">
                                <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
                                {t('common.sending', { defaultValue: 'Sending...' })}
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Icon icon="mdi:send" className="h-5 w-5" />
                                {t('company_profile.contact.submit')}
                              </span>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="lg" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Icon icon="mdi:email" className="me-2 h-5 w-5" />
                    {t('company_profile.email_btn')}
                  </Button>
                  <Button variant="outline" size="lg" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Icon icon="mdi:web" className="me-2 h-5 w-5" />
                    {t('company_profile.website_btn')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <main className="flex-1 relative z-10 bg-white/60 backdrop-blur-sm" role="main">
        <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] mx-auto py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Services */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">{t('company_profile.services.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(company.services ?? []).map(service => (
                      <div key={service} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <Icon icon="mdi:check-circle" className="h-5 w-5 text-accent" />
                        <span className="text-sm font-medium text-slate-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {companyCars.length > 0 && (
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-900">{t('company_profile.cars.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {companyCars.slice(0, 4).map((car) => (
                        <div
                          key={car.id}
                          className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
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
                              <p className="text-sm font-semibold text-slate-900">
                                {car.year} {car.make} {car.model}
                              </p>
                              <span className="text-xs font-bold text-slate-900">
                                ${car.price.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {car.bodyType} • {car.fuelType} • {car.transmission}
                            </p>
                            <p className="text-xs text-slate-500">
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
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900">{t('company_profile.reviews.title')} ({company.reviewCount})</CardTitle>
                    {canWriteReviews && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                        className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Icon icon="mdi:plus" className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('company_profile.reviews.write')}</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Review Form */}
                  {canWriteReviews && isReviewFormOpen && (
                    <Card className="border-accent/30 bg-accent/5">
                      <CardContent className="pt-6">
                        <form className="space-y-4" onSubmit={handleSubmitReview}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="review-comment" className="text-slate-700">{t('company_profile.reviews.your_rating')}</Label>
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none focus:ring-2 focus:ring-accent rounded hover:scale-110 transition-transform"
                                    onClick={() => setReviewRating(star)}
                                    aria-label={`${star} stars`}
                                  >
                                    <Icon
                                      icon="mdi:star"
                                      className={`h-5 w-5 ${
                                        star <= reviewRating
                                          ? 'text-accent fill-current'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="ms-2 text-sm text-slate-500">
                                  {reviewRating} / 5
                                </span>
                              </div>
                            </div>
                            <textarea
                              id="review-comment"
                              value={reviewComment}
                              onChange={(event) => setReviewComment(event.target.value)}
                              placeholder={t('company_profile.reviews.comment_placeholder')}
                              className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
                              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
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
                              className="border-slate-300 text-slate-600 hover:bg-slate-50"
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
                            <div className="h-4 w-24 rounded bg-slate-200" />
                            <div className="h-3 w-16 rounded bg-slate-200" />
                          </div>
                          <div className="h-3 w-full rounded bg-slate-200" />
                          <div className="h-3 w-5/6 rounded bg-slate-200" />
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
                    <p className="text-sm text-slate-500">
                      {t('company_profile.reviews.empty')}
                    </p>
                  )}

                  {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={`review-${review.id}-${review.created_at}`} className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                          <div className="flex items-start gap-3 mb-2">
                            {review.avatar && review.avatar.trim().length > 0 && (
                              <img
                                src={review.avatar}
                                alt={review.user_name || `${t('common.user')} #${review.user_id}`}
                                className="h-9 w-9 rounded-full object-cover border border-slate-200 flex-shrink-0 mt-1"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-sm sm:text-base text-slate-900 truncate">
                                  {review.user_name && review.user_name.trim().length > 0
                                    ? review.user_name
                                    : `${t('common.user')} #${review.user_id}`}
                                </span>

                                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                  {isReviewOwner(review) && (
                                    <div className="flex items-center gap-1">
                                      {editingReviewId === String(review.id) ? (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleUpdateReview(String(review.id))}
                                            disabled={isUpdatingReview}
                                            className="h-6 w-6"
                                            title={t('common.save')}
                                          >
                                            {isUpdatingReview ? (
                                              <Icon icon="mdi:loading" className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Icon icon="mdi:check" className="h-3.5 w-3.5 text-green-600" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleCancelEditReview}
                                            disabled={isUpdatingReview}
                                            className="h-6 w-6"
                                            title={t('common.cancel')}
                                          >
                                            <Icon icon="mdi:close" className="h-3.5 w-3.5 text-slate-400" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleStartEditReview(review)}
                                            className="h-6 w-6 text-slate-400 hover:text-slate-700"
                                            title={t('common.edit')}
                                          >
                                            <Icon icon="mdi:pencil" className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteReview(String(review.id))}
                                            disabled={isDeletingReview}
                                            className="h-6 w-6 text-slate-400 hover:text-red-500"
                                            title={t('common.delete')}
                                          >
                                            <Icon icon="mdi:delete" className="h-3.5 w-3.5" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    {formatDate(review.created_at, i18n.language)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, index) => (
                                  <Icon
                                    key={index}
                                    icon="mdi:star"
                                    className={`h-3.5 w-3.5 ${
                                      index < review.rating ? 'text-accent fill-current' : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {editingReviewId === String(review.id) ? (
                            <div className="mt-3 space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">{t('company_profile.reviews.your_rating')}</Label>
                                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className="focus:outline-none focus:ring-2 focus:ring-accent rounded"
                                      onClick={() => setEditRating(star)}
                                      aria-label={`${star} stars`}
                                    >
                                      <Icon
                                        icon="mdi:star"
                                        className={`h-5 w-5 ${
                                          star <= editRating
                                            ? 'text-accent fill-current'
                                            : 'text-slate-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  <span className="ms-2 text-sm text-slate-500">
                                    {editRating} / 5
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`edit-comment-${review.id}`} className="text-slate-700">{t('company_profile.reviews.comment_label')}</Label>
                                <textarea
                                  id={`edit-comment-${review.id}`}
                                  value={editComment}
                                  onChange={(event) => setEditComment(event.target.value)}
                                  placeholder={t('company_profile.reviews.comment_placeholder')}
                                  className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                />
                              </div>
                            </div>
                          ) : (
                            review.comment && (
                              <p className="text-sm text-slate-600">
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
                        className="border-slate-300 text-slate-600 hover:bg-slate-50"
                      >
                        <Icon icon="mdi:chevron-left" className="h-4 w-4 me-1" />
                        {t('company_profile.reviews.prev')}
                      </Button>
                      <span className="text-sm text-slate-500">
                        {reviewsPage} / {reviewsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isReviewsLoading || reviewsPage >= reviewsTotalPages}
                        onClick={() => setReviewsPage((prev) => Math.min(reviewsTotalPages, prev + 1))}
                        className="border-slate-300 text-slate-600 hover:bg-slate-50"
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
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">{t('company_profile.contact_info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.contact?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Icon icon="mdi:phone" className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="font-medium text-slate-700">{company.contact.phone}</p>
                    </div>
                  )}
                  {company.contact?.email && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Icon icon="mdi:email" className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="font-medium text-slate-700">{company.contact.email}</p>
                    </div>
                  )}
                  {company.contact?.website && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Icon icon="mdi:web" className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="font-medium text-slate-700">{company.contact.website}</p>
                    </div>
                  )}

                  {/* Social Networks */}
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <div className="flex items-center justify-center gap-4">
                      <a
                        href="#"
                        title="Facebook"
                        aria-label="Facebook"
                        className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <Icon icon="mdi:facebook" className="h-5 w-5 text-slate-600" />
                      </a>
                      <a
                        href="#"
                        title="Instagram"
                        aria-label="Instagram"
                        className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <Icon icon="mdi:instagram" className="h-5 w-5 text-slate-600" />
                      </a>
                      <a
                        href="#"
                        title="LinkedIn"
                        aria-label="LinkedIn"
                        className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <Icon icon="mdi:linkedin" className="h-5 w-5 text-slate-600" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">{t('company_profile.stats.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Rating */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <Icon icon="mdi:star" className="h-6 w-6 text-accent fill-current mb-2" />
                      <span className="text-xl font-bold text-slate-900">{company.rating}</span>
                      <p className="text-xs text-slate-500 mt-1">{t('company_profile.stats.rating')}</p>
                    </div>

                    {/* Reviews */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <Icon icon="mdi:chat" className="h-6 w-6 text-slate-600 mb-2" />
                      <span className="text-xl font-bold text-slate-900">{company.reviewCount}</span>
                      <p className="text-xs text-slate-500 mt-1">{t('company_profile.stats.reviews')}</p>
                    </div>

                    {/* Year */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <Icon icon="mdi:calendar" className="h-6 w-6 text-slate-600 mb-2" />
                      <span className="text-xl font-bold text-slate-900">{company.establishedYear}</span>
                      <p className="text-xs text-slate-500 mt-1">{t('company_profile.stats.founded')}</p>
                    </div>

                    {/* Services */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <Icon icon="mdi:briefcase" className="h-6 w-6 text-slate-600 mb-2" />
                      <span className="text-xl font-bold text-slate-900">{company.services?.length ?? 0}</span>
                      <p className="text-xs text-slate-500 mt-1">{t('company_profile.stats.services')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action - Yellow accent */}
              <Card className="bg-accent border-none shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{t('company_profile.cta.title')}</h3>
                  <p className="text-sm text-slate-700/80 mb-4">
                    {t('company_profile.cta.description')}
                  </p>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                    <Icon icon="mdi:send" className="me-2 h-4 w-4" />
                    {t('company_profile.cta.button')}
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyProfilePage;

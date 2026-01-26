import { formatRating, getRatingLabel } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ApiCompanyReview } from '@/services/companiesApi';

interface CompanyReviewItemProps {
    review: ApiCompanyReview;
    onEdit?: (review: ApiCompanyReview) => void;
    onDelete?: (reviewId: string) => void;
    isOwner?: boolean;
}

export function CompanyReviewItem({ review, onEdit, onDelete, isOwner }: CompanyReviewItemProps) {
    const { t, i18n } = useTranslation();
    const ratingLabel = getRatingLabel(review.rating);

    return (
        <div className="py-6 border-b border-slate-100 last:border-0">
            <div className="flex flex-col md:flex-row gap-6">
                {/* User Column (Left) - Vertical Stack */}
                <div className="md:w-48 flex-shrink-0">
                    <div className="flex items-start gap-4 md:flex-col md:gap-3">
                        <Avatar className="h-12 w-12 bg-green-500 text-white font-bold">
                            <AvatarImage src={review.avatar || undefined} alt={review.user_name || 'User'} />
                            <AvatarFallback className="bg-green-500 text-white">
                                {review.user_name?.substring(0, 1).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 text-base leading-tight">
                                {review.user_name || t('common.user', 'User')}
                            </div>

                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                <Icon icon="mdi:calendar-month-outline" className="h-4 w-4 shrink-0" />
                                <span>{formatDate(review.created_at, i18n.language)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Column (Right) */}
                <div className="flex-1 min-w-0">
                    {/* Header: Label and Rating */}
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900 capitalize">
                            {t(`reviews.labels.${ratingLabel}`, ratingLabel.replace('rating_', ''))}
                        </h3>

                        <div className="flex items-center justify-center h-9 w-11 bg-[#003580] text-white font-bold text-base rounded-[4px] shadow-sm">
                            {formatRating(review.rating)}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="flex gap-3 text-slate-700">
                        {review.rating >= 7 ? (
                            <Icon icon="mdi:emoticon-happy-outline" className="h-6 w-6 text-green-500 shrink-0" />
                        ) : (
                            <Icon icon="mdi:emoticon-sad-outline" className="h-6 w-6 text-slate-400 shrink-0" />
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed m-0 text-sm">
                            {review.comment}
                        </p>
                    </div>

                    {/* Company Reply */}
                    {review.company_reply && (
                        <div className="mt-4 flex gap-3 text-slate-700">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <Icon icon="mdi:office-building" className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">
                                        {t('company_profile.reviews.response_from_company', 'Response from company')}
                                    </span>
                                    {review.company_reply_date && (
                                        <span className="text-xs text-slate-400">
                                            {formatDate(review.company_reply_date, i18n.language)}
                                        </span>
                                    )}
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed m-0 text-sm">
                                    {review.company_reply}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {isOwner && (
                        <div className="flex justify-end gap-2 mt-4 pt-4">
                            <button
                                onClick={() => onEdit?.(review)}
                                className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                                <Icon icon="mdi:pencil" className="h-3 w-3" />
                                {t('common.edit', 'Edit')}
                            </button>
                            <button
                                onClick={() => review.id && onDelete?.(String(review.id))}
                                className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                            >
                                <Icon icon="mdi:delete" className="h-3 w-3" />
                                {t('common.delete', 'Delete')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

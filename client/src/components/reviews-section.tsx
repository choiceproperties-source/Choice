import { ReviewStars } from "@/components/review-stars";
import { ReviewCard } from "@/components/review-card";
import type { PropertyReviewsData } from "@/hooks/use-property-reviews";

interface ReviewsSectionProps {
  data: PropertyReviewsData;
}

export function ReviewsSection({ data }: ReviewsSectionProps) {
  if (data.totalReviews === 0) {
    return (
      <div 
        className="text-center py-8 text-gray-500 dark:text-gray-400"
        data-testid="section-reviews-empty"
      >
        <p>No reviews available for this property.</p>
      </div>
    );
  }

  return (
    <div data-testid="section-reviews" className="space-y-8">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Reviews & Ratings
      </h2>

      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30 transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {data.averageRating}
          </span>
          <div data-testid="rating-summary-stars">
            <ReviewStars rating={Math.round(data.averageRating)} size="md" />
          </div>
        </div>

        <div className="text-gray-700 dark:text-gray-300">
          <p className="text-sm">
            Based on <span className="font-semibold">{data.totalReviews}</span> reviews
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Verified tenant reviews
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div 
        className="space-y-4"
        data-testid="reviews-list"
      >
        {data.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

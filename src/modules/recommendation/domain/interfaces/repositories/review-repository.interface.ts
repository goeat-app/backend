import { ReviewModel } from '@/modules/recommendation/infra/database/review.model';

export abstract class IReviewRepository {
  abstract findAllReviews(): Promise<ReviewModel[]>;
}

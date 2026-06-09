import { IReviewRepository } from '@/modules/recommendation/domain/interfaces/repositories/review-repository.interface';
import { ReviewModel } from '@/modules/recommendation/infra/database/review.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectModel(ReviewModel)
    private readonly reviewModel: typeof ReviewModel,
  ) {}

  async findAllReviews(): Promise<ReviewModel[]> {
    return await this.reviewModel.findAll({
      attributes: ['user_id', 'restaurant_id', 'rating'],
    });
  }
}

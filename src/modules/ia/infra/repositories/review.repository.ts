import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ReviewModel } from '../database/review.model';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectModel(ReviewModel)
    private readonly reviewModel: typeof ReviewModel,
  ) {}

  async findAllReviews() {
    return await this.reviewModel.findAll({
      attributes: ['user_id', 'restaurant_id', 'rating'],
    });
  }
}

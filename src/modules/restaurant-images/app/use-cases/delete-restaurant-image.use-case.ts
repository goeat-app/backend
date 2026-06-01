import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { IRestaurantImageRepository } from '../../domain/interfaces/restaurant-image.repository.interface';

const BUCKET = 'restaurant_pictures';

@Injectable()
export class DeleteRestaurantImageUseCase {
  constructor(
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @Inject(IRestaurantImageRepository)
    private readonly restaurantImageRepository: IRestaurantImageRepository,
  ) {}

  async execute(params: {
    imageId: string;
    restaurantId: string;
  }): Promise<void> {
    // Verify the image belongs to the restaurant
    const image = await this.restaurantImageRepository.findByIdAndRestaurantId(
      params.imageId,
      params.restaurantId,
    );

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete from storage
    await this.storageService.deleteFile(BUCKET, image.image_key);

    // Delete from database
    await this.restaurantImageRepository.deleteById(params.imageId);
  }
}

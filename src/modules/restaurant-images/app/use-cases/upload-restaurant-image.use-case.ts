import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { IRestaurantImageRepository } from '../../domain/interfaces/restaurant-image.repository.interface';

const BUCKET = 'restaurant_pictures';

@Injectable()
export class UploadRestaurantImageUseCase {
  constructor(
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @Inject(IRestaurantImageRepository)
    private readonly restaurantImageRepository: IRestaurantImageRepository,
  ) {}

  async execute(params: {
    restaurantId: string;
    buffer: Buffer;
    mimetype: string;
    isCover: boolean;
  }) {
    const fileId = randomUUID();
    const storagePath = `${params.restaurantId}/${fileId}`;

    await this.storageService.uploadFile(
      BUCKET,
      storagePath,
      params.buffer,
      params.mimetype,
    );

    return this.restaurantImageRepository.create({
      restaurant_id: params.restaurantId,
      image_key: storagePath,
      is_cover: params.isCover,
    });
  }
}

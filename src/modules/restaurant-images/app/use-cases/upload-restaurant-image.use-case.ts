import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { IRestaurantImageRepository } from '../../domain/interfaces/restaurant-image.repository.interface';
import { FIREBASE_STORAGE_CONFIG } from '../../../../lib/infra/firebase/storage-config';

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
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ??
      FIREBASE_STORAGE_CONFIG.DEFAULTS_BUCKET_NAME;

    const storagePath = `${params.restaurantId}/${fileId}.${params.mimetype.split('/')[1]}`;

    await this.storageService.uploadFile(
      bucketName,
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

import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { IRestaurantImageRepository } from '../../domain/interfaces/restaurant-image.repository.interface';
import { FIREBASE_STORAGE_CONFIG } from '@/lib/infra/firebase/storage-config';
import { getStorage } from 'firebase-admin/storage';

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
    const bucketName = getStorage().bucket().name;

    const storagePath = `restaurants/${params.restaurantId}/pictures/${fileId}.${params.mimetype.split('/')[1]}`;

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

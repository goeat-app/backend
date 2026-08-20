import { Inject, Injectable } from '@nestjs/common';
import { FIREBASE_STORAGE_CONFIG } from '../infra/firebase/storage-config';
import { IStorageService } from '../infra/external/storage.service.interface';
import { getStorage } from 'firebase-admin/storage';

/**
 * Helper to resolve restaurant image URLs
 * Now uses Firebase Storage for dynamic URL generation
 */
@Injectable()
export class RestaurantImageUrlResolver {
  constructor(
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * Resolve a file key to its download URL
   * For HTTP(S) URLs, returns as-is
   * For keys, fetches the URL from Firebase Storage
   */
  async resolve(imageKey: string, bucket?: string): Promise<string> {
    // If it's already a URL, return as-is
    if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
      return imageKey;
    }

    // If key is empty or null, return empty string
    if (!imageKey) {
      return '';
    }

    const bucketName = bucket || getStorage().bucket().name;
    return this.storageService.getDownloadUrl(bucketName, imageKey);
  }
}

import { Injectable } from '@nestjs/common';
import { getStorage } from 'firebase-admin/storage';

/**
 * Maps type icon_key to Firebase Storage URL
 * Returns null if icon_key is not present
 */
@Injectable()
export class TypeImageMapper {
  /**
   * Resolve a food/place type icon to its Firebase Storage URL
   * @param iconKey The icon key (e.g., 'italian-food', 'bistro-env')
   * @param folder The folder path in Firebase Storage (e.g., 'items', 'environments')
   * @returns Firebase Storage URL or null
   */
  mapIconToUrl(
    iconKey: string | null | undefined,
    folder: string,
  ): string | null {
    if (!iconKey) {
      return null;
    }

    const isEmulator = !!process.env.AUTH_EMULATOR_HOST;
    const bucketName = getStorage().bucket().name;

    if (isEmulator) {
      // Local emulator URL
      const path = `${folder}/${iconKey}`;
      return `http://localhost:9199/storage/v1/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
    }

    // Production: Return HTTPS Firebase Storage media URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(`${folder}/${iconKey}`)}?alt=media`;
  }
}

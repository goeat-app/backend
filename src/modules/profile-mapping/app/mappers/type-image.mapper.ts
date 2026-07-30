import { Injectable } from '@nestjs/common';
import { FIREBASE_STORAGE_CONFIG } from '../../../../lib/infra/firebase/storage-config';

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
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ??
      FIREBASE_STORAGE_CONFIG.DEFAULTS_BUCKET_NAME;

    if (isEmulator) {
      // Local emulator URL
      const path = `${folder}/${iconKey}`;
      return `http://localhost:9199/storage/v1/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
    }

    // Production: Return gs:// URL (will be resolved server-side via Admin SDK if needed)
    return `gs://${bucketName}/${folder}/${iconKey}`;
  }
}

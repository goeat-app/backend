import { Injectable } from '@nestjs/common';

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
    const bucket = 'restaurant-images';

    if (isEmulator) {
      // Local emulator URL
      const projectId = process.env.EMULATOR_PROJECT_ID || 'demo-goeat';
      const path = `${folder}/${iconKey}`;
      return `http://localhost:9199/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }

    // Production: Return gs:// URL (will be resolved server-side via Admin SDK if needed)
    return `gs://${bucket}/${folder}/${iconKey}`;
  }
}

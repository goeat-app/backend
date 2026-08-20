/**
 * Firebase Storage Configuration
 * Centralized configuration for buckets, paths, and related constants
 */

import { getStorage } from 'firebase-admin/storage';

export const FIREBASE_STORAGE_CONFIG = {
  // Path patterns
  PATHS: {
    RESTAURANT_IMAGES: (restaurantId: string, fileId: string) =>
      `restaurants/${restaurantId}/${fileId}`,
  },
} as const;

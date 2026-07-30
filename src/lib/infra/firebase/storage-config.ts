/**
 * Firebase Storage Configuration
 * Centralized configuration for buckets, paths, and related constants
 */

export const FIREBASE_STORAGE_CONFIG = {
  // Path patterns
  PATHS: {
    RESTAURANT_IMAGES: (restaurantId: string, fileId: string) =>
      `restaurants/${restaurantId}/${fileId}`,
  },

  // Default bucket name
  DEFAULTS_BUCKET_NAME: `${process.env.PROJECT_ID}.appspot.com`,
} as const;

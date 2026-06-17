const DEFAULT_BUCKET = 'restaurant_pictures';

export function resolveRestaurantImageUrl(
  imageKey: string,
  supabaseUrl?: string,
  bucket = DEFAULT_BUCKET,
): string {
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return imageKey;
  }

  if (!supabaseUrl) {
    return imageKey;
  }

  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${imageKey}`;
}

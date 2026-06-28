export class UserPreferenceEntity {
  constructor(
    public readonly userId: string,
    public readonly maxPrice: number | null,
    public readonly minPrice: number | null,
    public readonly preferredPlaceTypes: string[],
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly favoriteCuisines: string[] = [],
    public readonly preferredAmbiance: string[] = [],
    public readonly budgetLevel: number | null = null,
  ) {}
}

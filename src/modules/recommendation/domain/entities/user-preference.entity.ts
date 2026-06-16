export class UserPreferenceEntity {
  constructor(
    public readonly userId: string,
    public readonly maxPrice: number | null,
    public readonly minPrice: number | null,
    public readonly preferredPlaceTypes: string[],
    public readonly preferredFoodTypes: string[],
    public readonly latitude: number | null,
    public readonly longitude: number | null,
  ) {}
}

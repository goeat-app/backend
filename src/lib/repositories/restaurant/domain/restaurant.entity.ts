export class RestaurantEntity {
  constructor(
    public readonly address: string,
    public readonly averagePrice: number,
    public readonly averageRating: number,
    public readonly city: string,
    public readonly foodType: string,
    public readonly id: string,
    public readonly isActive: boolean,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly name: string,
    public readonly placeType: string,
    public readonly placeTypeSlug: string,
    public readonly state: string,
    public readonly restaurantSlug: string,
    public readonly imageUrl: string | null,
  ) {}

  /**
   * Converte o preço médio em uma escala de 1-5
   * 1 = Muito barato (até R$ 30)
   * 2 = Barato (R$ 30-50)
   * 3 = Médio (R$ 50-80)
   * 4 = Caro (R$ 80-120)
   * 5 = Muito caro (acima de R$ 120)
   */
  get priceLevel(): number {
    if (this.averagePrice <= 30) return 1;
    if (this.averagePrice <= 50) return 2;
    if (this.averagePrice <= 80) return 3;
    if (this.averagePrice <= 120) return 4;
    return 5;
  }
}

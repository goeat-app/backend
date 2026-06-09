export class ReviewEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly rating: number,
  ) {}
}

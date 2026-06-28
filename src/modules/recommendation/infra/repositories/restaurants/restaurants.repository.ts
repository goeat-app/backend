import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RestaurantCandidate } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { Op } from 'sequelize';
import { calculateDistanceMeters } from '@/modules/recommendation/app/utils/distance';
import { Location } from '@/modules/recommendation/domain/value-objects/location';

@Injectable()
export class RestaurantRepository implements IRestaurantRepository {
  constructor(
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
  ) {}

  private readonly defaultIncludes = [
    {
      model: PlaceTypeModel,
      attributes: ['id', 'name', 'slug'],
    },
    {
      model: FoodTypeModel,
      attributes: ['id', 'name', 'slug'],
    },
  ];

  async findAllActiveRestaurants(): Promise<RestaurantsModel[]> {
    return await this.restaurantModel.findAll({
      where: { is_active: true },
      include: this.defaultIncludes,
      raw: false,
    });
  }

  async findByIds(ids: string[]): Promise<RestaurantsModel[]> {
    return await this.restaurantModel.findAll({
      where: { id: ids },
      include: this.defaultIncludes,
      raw: false,
    });
  }

  async findCachedNearby(input: {
    location: Location;
    radiusMeters: number;
  }): Promise<RestaurantsModel[]> {
    const restaurants = await this.restaurantModel.findAll({
      where: {
        is_active: true,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
      include: this.defaultIncludes,
      raw: false,
    });

    return restaurants.filter((restaurant) => {
      const distanceMeters = calculateDistanceMeters(input.location, {
        latitude: Number(restaurant.latitude),
        longitude: Number(restaurant.longitude),
      });

      return distanceMeters <= input.radiusMeters;
    });
  }

  async upsertDiscoveredRestaurants(
    candidates: RestaurantCandidate[],
  ): Promise<RestaurantsModel[]> {
    const now = new Date();

    for (const candidate of candidates) {
      const existing = await this.restaurantModel.findOne({
        where: {
          provider: candidate.provider,
          provider_place_id: candidate.providerPlaceId,
        },
      });

      const details = candidate as RestaurantCandidate & {
        website?: string;
        phone?: string;
        editorialSummary?: string;
      };
      const googleFields = {
        provider: candidate.provider,
        provider_place_id: candidate.providerPlaceId,
        name: candidate.name,
        latitude: candidate.location.latitude,
        longitude: candidate.location.longitude,
        primary_type: candidate.primaryType ?? null,
        types: candidate.types,
        price_level: candidate.priceLevel ?? null,
        google_rating: candidate.rating ?? null,
        google_rating_count: candidate.ratingCount ?? null,
        business_status: candidate.businessStatus ?? null,
        open_now: candidate.openNow ?? null,
        ...(details.website !== undefined ? { website: details.website } : {}),
        ...(details.phone !== undefined ? { phone: details.phone } : {}),
        ...(details.editorialSummary !== undefined
          ? { editorial_summary: details.editorialSummary }
          : {}),
        last_seen_at: now,
        last_synced_at: now,
        updated_at: now,
      };

      if (existing) {
        await existing.update(googleFields);
        continue;
      }

      await this.restaurantModel.create({
        ...googleFields,
        slug: this.buildSlug(candidate.name, candidate.providerPlaceId),
        average_rating: 0,
        total_reviews: 0,
        average_price: 0,
        is_active: true,
        first_seen_at: now,
        created_at: now,
      });
    }

    return this.findByProviderPlaces(candidates);
  }

  private async findByProviderPlaces(
    candidates: RestaurantCandidate[],
  ): Promise<RestaurantsModel[]> {
    return this.restaurantModel.findAll({
      where: {
        [Op.or]: candidates.map((candidate) => ({
          provider: candidate.provider,
          provider_place_id: candidate.providerPlaceId,
        })),
      },
      include: this.defaultIncludes,
      raw: false,
    });
  }

  private buildSlug(name: string, providerPlaceId: string): string {
    const baseSlug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);

    return `${baseSlug || 'restaurant'}-${providerPlaceId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 12)}`;
  }
}

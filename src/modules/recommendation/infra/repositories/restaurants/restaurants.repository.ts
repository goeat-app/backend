import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type IncludeOptions } from 'sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RestaurantQueryFilters } from '@/modules/recommendation/domain/types/restaurant-query-filters.type';
import { RestaurantCandidate } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { Location } from '@/modules/recommendation/domain/value-objects/location';
import { calculateDistanceMeters } from '@/modules/recommendation/app/utils/distance';
import { normalizePhoneNumber } from '@/lib/helpers/normalize-phone-number.helper';

@Injectable()
export class RestaurantRepository implements IRestaurantRepository {
  private readonly _logger = new Logger(RestaurantRepository.name);

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

  async findAllActiveRestaurants(
    filters?: RestaurantQueryFilters,
  ): Promise<RestaurantsModel[]> {
    const where: Record<string, unknown> = { is_active: true };

    if (filters?.minRating) {
      where.average_rating = { [Op.gte]: filters.minRating };
    }

    if (filters?.minPrice !== undefined && filters?.maxPrice !== undefined) {
      where.average_price = {
        [Op.between]: [filters.minPrice, filters.maxPrice],
      };
    } else if (filters?.minPrice !== undefined) {
      where.average_price = { [Op.gte]: filters.minPrice };
    } else if (filters?.maxPrice !== undefined) {
      where.average_price = { [Op.lte]: filters.maxPrice };
    }

    const placeTypeInclude: IncludeOptions = {
      model: PlaceTypeModel,
      attributes: ['id', 'name', 'slug'],
    };
    const foodTypeInclude: IncludeOptions = {
      model: FoodTypeModel,
      attributes: ['id', 'name', 'slug'],
    };

    const hasFoodFilter = Boolean(filters?.foodTypes?.length);
    const hasPlaceFilter = Boolean(filters?.restaurantStyles?.length);

    if (hasFoodFilter && hasPlaceFilter) {
      placeTypeInclude.required = true;
      foodTypeInclude.required = true;

      return await this.restaurantModel.findAll({
        where: {
          ...where,
          [Op.or]: [
            { '$foodType.name$': { [Op.in]: filters!.foodTypes } },
            { '$placeType.name$': { [Op.in]: filters!.restaurantStyles } },
          ],
        },
        include: [placeTypeInclude, foodTypeInclude],
        raw: false,
      });
    }

    if (hasPlaceFilter) {
      placeTypeInclude.where = {
        name: { [Op.in]: filters!.restaurantStyles },
      };
      placeTypeInclude.required = true;
    }

    if (hasFoodFilter) {
      foodTypeInclude.where = { name: { [Op.in]: filters!.foodTypes } };
      foodTypeInclude.required = true;
    }

    return await this.restaurantModel.findAll({
      where,
      include: [placeTypeInclude, foodTypeInclude],
      raw: false,
    });
  }

  async findByIds(ids: string[]): Promise<RestaurantsModel[]> {
    if (ids.length === 0) {
      return [];
    }

    return await this.restaurantModel.findAll({
      where: { id: { [Op.in]: ids } },
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
    if (!candidates.length) {
      return [];
    }

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
        opening_hours: candidate.openingHours ?? null,
        ...(details.website !== undefined ? { website: details.website } : {}),
        ...(details.phone !== undefined
          ? { phone: normalizePhoneNumber(details.phone) }
          : {}),
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
        average_rating: candidate.rating ?? 0,
        total_reviews: candidate.ratingCount ?? 0,
        average_price: candidate.priceLevel ?? 0,
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

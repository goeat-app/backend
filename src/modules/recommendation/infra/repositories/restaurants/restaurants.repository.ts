import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RestaurantCandidate } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { calculateDistanceMeters } from '@/modules/recommendation/app/utils/distance';
import { Location } from '@/modules/recommendation/domain/value-objects/location';
import { RestaurantQueryFilters } from '@/modules/recommendation/domain/types/restaurant-query-filters.type';

@Injectable()
export class RestaurantRepository implements IRestaurantRepository {
  constructor(
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
  ) {}

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

    return await this.restaurantModel.findAll({
      where,
      raw: false,
    });
  }

  async findByIds(ids: string[]): Promise<RestaurantsModel[]> {
    if (ids.length === 0) {
      return [];
    }

    return await this.restaurantModel.findAll({
      where: { id: { [Op.in]: ids } },
      raw: false,
    });
  }

  async findByProviderPlaceIds(
    providerPlaceIds: string[],
    provider: string,
  ): Promise<RestaurantsModel[]> {
    if (providerPlaceIds.length === 0) {
      return [];
    }

    return await this.restaurantModel.findAll({
      where: {
        provider,
        provider_place_id: { [Op.in]: providerPlaceIds },
      },
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
        whatsapp?: string;
        description?: string;
        imageUrl?: string;
        editorialSummary?: string;
        editorialSummarySource?: 'google' | 'generated';
      };
      const googleFields = {
        provider: candidate.provider,
        provider_place_id: candidate.providerPlaceId,
        name: candidate.name,
        address: candidate.address ?? null,
        latitude: candidate.location.latitude,
        longitude: candidate.location.longitude,
        city: candidate.city ?? 'Unknown',
        state: candidate.state ?? 'Unknown',
        postal_code: candidate.postalCode ?? '00000',
        primary_type: candidate.primaryType ?? null,
        types: candidate.types,
        price_level: candidate.priceLevel ?? null,
        google_rating: candidate.rating ?? null,
        google_rating_count: candidate.ratingCount ?? null,
        business_status: candidate.businessStatus ?? null,
        ...(details.website !== undefined ? { website: details.website } : {}),
        ...(details.phone !== undefined ? { phone: details.phone } : {}),
        ...(details.whatsapp !== undefined
          ? { whatsapp: details.whatsapp }
          : {}),
        ...(details.description !== undefined
          ? { description: details.description }
          : {}),
        ...(details.imageUrl !== undefined
          ? { image_url: details.imageUrl }
          : {}),
        ...(details.editorialSummary !== undefined
          ? { editorial_summary: details.editorialSummary }
          : {}),
        ...(details.editorialSummarySource !== undefined
          ? { editorial_summary_source: details.editorialSummarySource }
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

  async updateRestaurantDetails(
    restaurantId: string,
    details: Partial<RestaurantsModel>,
  ): Promise<RestaurantsModel> {
    const restaurant = await this.restaurantModel.findByPk(restaurantId);

    if (!restaurant) {
      throw new Error(`Restaurant with ID ${restaurantId} not found`);
    }

    await restaurant.update(details);
    return restaurant;
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

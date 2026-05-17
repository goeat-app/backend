import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantRole } from '../../domain/enums/restaurant-role.enum';
import {
  IRestaurantUserRoleRepository,
  RestaurantUserRoleRecord,
} from '../../domain/interfaces/restaurant-user-role.repository.interface';
import { RestaurantUserRoleModel } from '../database/restaurant-user-role.model';

@Injectable()
export class SequelizeRestaurantUserRoleRepository implements IRestaurantUserRoleRepository {
  constructor(
    @InjectModel(RestaurantUserRoleModel)
    private readonly model: typeof RestaurantUserRoleModel,
  ) {}

  async findByUserAndRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<RestaurantUserRoleRecord | null> {
    const record = await this.model.findOne({
      where: {
        user_id: userId,
        restaurant_id: restaurantId,
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async listByRestaurant(
    restaurantId: string,
  ): Promise<RestaurantUserRoleRecord[]> {
    const records = await this.model.findAll({
      where: { restaurant_id: restaurantId },
      order: [['createdAt', 'ASC']],
    });

    return records.map((record) => this.toDomain(record));
  }

  async assignOrUpdateRole(params: {
    restaurantId: string;
    userId: string;
    role: RestaurantRole;
  }): Promise<RestaurantUserRoleRecord> {
    const [record] = await this.model.findOrCreate({
      where: {
        restaurant_id: params.restaurantId,
        user_id: params.userId,
      },
      defaults: {
        restaurant_id: params.restaurantId,
        user_id: params.userId,
        role: params.role,
      },
    });

    if (record.role !== params.role) {
      record.role = params.role;
      await record.save();
    }

    return this.toDomain(record);
  }

  async removeRole(params: {
    restaurantId: string;
    userId: string;
  }): Promise<void> {
    await this.model.destroy({
      where: {
        restaurant_id: params.restaurantId,
        user_id: params.userId,
      },
    });
  }

  async countOwners(restaurantId: string): Promise<number> {
    return this.model.count({
      where: {
        restaurant_id: restaurantId,
        role: RestaurantRole.OWNER,
      },
    });
  }

  async countByRestaurant(restaurantId: string): Promise<number> {
    return this.model.count({
      where: { restaurant_id: restaurantId },
    });
  }

  private toDomain(record: RestaurantUserRoleModel): RestaurantUserRoleRecord {
    return {
      id: record.id,
      restaurantId: record.restaurant_id,
      userId: record.user_id,
      role: record.role,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantsModel } from '@/modules/ia/infra/database/restaurant.model';
import { RestaurantRole } from '../../domain/enums/restaurant-role.enum';
import {
  IRestaurantUserRoleRepository,
  RestaurantUserRoleRecord,
} from '../../domain/interfaces/restaurant-user-role.repository.interface';

@Injectable()
export class RestaurantAccessService {
  constructor(
    @Inject(IRestaurantUserRoleRepository)
    private readonly restaurantUserRoleRepository: IRestaurantUserRoleRepository,
    @InjectModel(RestaurantsModel)
    private readonly restaurantsModel: typeof RestaurantsModel,
  ) {}

  async hasAnyRole(params: {
    userId: string;
    restaurantId: string;
    roles: RestaurantRole[];
  }): Promise<boolean> {
    const membership =
      await this.restaurantUserRoleRepository.findByUserAndRestaurant(
        params.userId,
        params.restaurantId,
      );

    if (!membership) {
      return false;
    }

    return params.roles.includes(membership.role);
  }

  async listRoles(params: {
    restaurantId: string;
    requesterUserId: string;
  }): Promise<RestaurantUserRoleRecord[]> {
    await this.ensureRestaurantExists(params.restaurantId);
    await this.ensureHasAnyRole({
      userId: params.requesterUserId,
      restaurantId: params.restaurantId,
      allowedRoles: [
        RestaurantRole.OWNER,
        RestaurantRole.MANAGER,
        RestaurantRole.VIEWER,
      ],
    });

    return this.restaurantUserRoleRepository.listByRestaurant(
      params.restaurantId,
    );
  }

  async assignOrUpdateRole(params: {
    restaurantId: string;
    targetUserId: string;
    role: RestaurantRole;
    requesterUserId: string;
  }): Promise<RestaurantUserRoleRecord> {
    await this.ensureRestaurantExists(params.restaurantId);

    const membershipsCount =
      await this.restaurantUserRoleRepository.countByRestaurant(
        params.restaurantId,
      );

    const canBootstrapFirstOwner =
      membershipsCount === 0 &&
      params.targetUserId === params.requesterUserId &&
      params.role === RestaurantRole.OWNER;

    if (!canBootstrapFirstOwner) {
      await this.ensureHasAnyRole({
        userId: params.requesterUserId,
        restaurantId: params.restaurantId,
        allowedRoles: [RestaurantRole.OWNER],
      });
    }

    const existingMembership =
      await this.restaurantUserRoleRepository.findByUserAndRestaurant(
        params.targetUserId,
        params.restaurantId,
      );

    if (
      existingMembership?.role === RestaurantRole.OWNER &&
      params.role !== RestaurantRole.OWNER
    ) {
      const ownersCount = await this.restaurantUserRoleRepository.countOwners(
        params.restaurantId,
      );

      if (ownersCount <= 1) {
        throw new BadRequestException(
          'Cannot downgrade the last owner of this restaurant',
        );
      }
    }

    return this.restaurantUserRoleRepository.assignOrUpdateRole({
      restaurantId: params.restaurantId,
      userId: params.targetUserId,
      role: params.role,
    });
  }

  async removeRole(params: {
    restaurantId: string;
    targetUserId: string;
    requesterUserId: string;
  }): Promise<void> {
    await this.ensureRestaurantExists(params.restaurantId);
    await this.ensureHasAnyRole({
      userId: params.requesterUserId,
      restaurantId: params.restaurantId,
      allowedRoles: [RestaurantRole.OWNER],
    });

    const existingMembership =
      await this.restaurantUserRoleRepository.findByUserAndRestaurant(
        params.targetUserId,
        params.restaurantId,
      );

    if (!existingMembership) {
      throw new NotFoundException('Restaurant role assignment not found');
    }

    if (existingMembership.role === RestaurantRole.OWNER) {
      const ownersCount = await this.restaurantUserRoleRepository.countOwners(
        params.restaurantId,
      );

      if (ownersCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner of this restaurant',
        );
      }
    }

    await this.restaurantUserRoleRepository.removeRole({
      restaurantId: params.restaurantId,
      userId: params.targetUserId,
    });
  }

  private async ensureRestaurantExists(restaurantId: string): Promise<void> {
    const exists = await this.restaurantsModel.findByPk(restaurantId);

    if (!exists) {
      throw new NotFoundException('Restaurant not found');
    }
  }

  private async ensureHasAnyRole(params: {
    userId: string;
    restaurantId: string;
    allowedRoles: RestaurantRole[];
  }): Promise<void> {
    const allowed = await this.hasAnyRole({
      userId: params.userId,
      restaurantId: params.restaurantId,
      roles: params.allowedRoles,
    });

    if (!allowed) {
      throw new ForbiddenException('Insufficient role for this restaurant');
    }
  }
}

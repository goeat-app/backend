import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { RestaurantAccessService } from '../../app/services/restaurant-access.service';
import { RestaurantRole } from '../../domain/enums/restaurant-role.enum';
import { RestaurantRoles } from '../auth/restaurant-roles.decorator';
import { RestaurantRolesGuard } from '../auth/restaurant-roles.guard';
import { UpsertRestaurantUserRoleDto } from '../../dtos/upsert-restaurant-user-role.dto';
import { RestaurantUserRoleResponseDto } from '../../dtos/restaurant-user-role-response.dto';

type RequestWithUser = Request & {
  user?: {
    id?: string;
  };
};

@UseGuards(JwtAuthGuard, RestaurantRolesGuard)
@Controller('restaurants/:restaurantId/access')
export class RestaurantAccessController {
  constructor(
    private readonly restaurantAccessService: RestaurantAccessService,
  ) {}

  @Get('users')
  @RestaurantRoles(
    RestaurantRole.OWNER,
    RestaurantRole.MANAGER,
    RestaurantRole.VIEWER,
  )
  async listRoles(
    @Param('restaurantId') restaurantId: string,
    @Req() req: RequestWithUser,
  ): Promise<RestaurantUserRoleResponseDto[]> {
    return this.restaurantAccessService.listRoles({
      restaurantId,
      requesterUserId: req.user?.id as string,
    });
  }

  @Put('users/:userId')
  @RestaurantRoles(RestaurantRole.OWNER)
  async assignOrUpdateRole(
    @Param('restaurantId') restaurantId: string,
    @Param('userId') userId: string,
    @Body() body: UpsertRestaurantUserRoleDto,
    @Req() req: RequestWithUser,
  ): Promise<RestaurantUserRoleResponseDto> {
    return this.restaurantAccessService.assignOrUpdateRole({
      restaurantId,
      targetUserId: userId,
      role: body.role,
      requesterUserId: req.user?.id as string,
    });
  }

  @Delete('users/:userId')
  @HttpCode(204)
  @RestaurantRoles(RestaurantRole.OWNER)
  async removeRole(
    @Param('restaurantId') restaurantId: string,
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.restaurantAccessService.removeRole({
      restaurantId,
      targetUserId: userId,
      requesterUserId: req.user?.id as string,
    });
  }
}

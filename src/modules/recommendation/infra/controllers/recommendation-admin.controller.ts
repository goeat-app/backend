import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { RecommendationDebugService } from '../../app/services/recommendation-debug.service';
import { RecommendationMaintenanceService } from '../../app/services/recommendation-maintenance.service';
import { RecommendationStrategyConfigService } from '../../app/services/recommendation-strategy-config.service';
import type { RecommendationStrategyConfig } from '../../domain/interfaces/recommendation-operations.interface';

@Controller('admin/recommendation-sessions')
export class RecommendationAdminController {
  constructor(
    private readonly debugService: RecommendationDebugService,
    private readonly maintenanceService: RecommendationMaintenanceService,
    private readonly strategyConfigService: RecommendationStrategyConfigService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config/current')
  @UseGuards(FirebaseAuthGuard)
  currentConfig(
    @Req() req: Request & { user: UserModel },
  ): RecommendationStrategyConfig {
    this.assertAdmin(req.user);
    const config = this.strategyConfigService.getConfig();
    return config;
  }

  @Get(':sessionId')
  @UseGuards(FirebaseAuthGuard)
  async debugSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request & { user: UserModel },
  ): Promise<Record<string, unknown>> {
    this.assertAdmin(req.user);
    return this.debugService.getSessionDebug(sessionId);
  }

  @Post('jobs/refresh-restaurants')
  @UseGuards(FirebaseAuthGuard)
  async refreshRestaurants(
    @Req() req: Request & { user: UserModel },
  ): Promise<{ processedCount: number }> {
    this.assertAdmin(req.user);
    return this.maintenanceService.refreshStaleRestaurants();
  }

  @Post('jobs/recompute-user-profiles')
  @UseGuards(FirebaseAuthGuard)
  async recomputeProfiles(
    @Req() req: Request & { user: UserModel },
  ): Promise<{ processedCount: number }> {
    this.assertAdmin(req.user);
    return this.maintenanceService.recomputeUserProfiles();
  }

  private assertAdmin(user: UserModel): void {
    const adminEmails = (
      this.configService.get<string>('RECOMMENDATION_ADMIN_EMAILS') ?? ''
    )
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (
      !adminEmails.length ||
      !adminEmails.includes(user.email.toLowerCase())
    ) {
      throw new ForbiddenException('Recommendation admin access required');
    }
  }
}

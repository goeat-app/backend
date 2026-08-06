import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecommendationMaintenanceService } from './recommendation-maintenance.service';

@Injectable()
export class RecommendationMaintenanceSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(
    RecommendationMaintenanceSchedulerService.name,
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly maintenanceService: RecommendationMaintenanceService,
  ) {}

  onModuleInit(): void {
    if (
      this.configService.get<string>('RECOMMENDATION_JOBS_ENABLED') !== 'true'
    ) {
      return;
    }

    const intervalMs = this.getIntervalMs();

    setInterval(() => {
      void this.runDailyJobs();
    }, intervalMs).unref();

    this.logger.log(
      `Recommendation maintenance jobs scheduled every ${intervalMs}ms`,
    );
  }

  private async runDailyJobs(): Promise<void> {
    await this.maintenanceService.refreshStaleRestaurants();
    await this.maintenanceService.recomputeUserProfiles();
  }

  private getIntervalMs(): number {
    const hours = Number(
      this.configService.get<string>('RECOMMENDATION_JOBS_INTERVAL_HOURS') ??
        24,
    );

    return (Number.isFinite(hours) ? hours : 24) * 60 * 60 * 1000;
  }
}

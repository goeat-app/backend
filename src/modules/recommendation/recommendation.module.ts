import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '@/modules/auth/auth.module';

import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { ReviewModel } from '@/modules/recommendation/infra/database/review.model';
import { RecommendationInteractionModel } from '@/modules/recommendation/infra/database/recommendation-interaction.model';
import { RecommendationFeedbackStateModel } from '@/modules/recommendation/infra/database/recommendation-feedback-state.model';
import { RecommendationModel } from '@/modules/recommendation/infra/database/recommendation.model';
import { RecommendationSessionModel } from '@/modules/recommendation/infra/database/recommendation-session.model';
import { RestaurantRatingModel } from '@/modules/recommendation/infra/database/restaurant-rating.model';
import { UserPreferenceModel } from '@/modules/recommendation/infra/database/user-preference.model';
import { UserProfileModel } from '@/modules/recommendation/infra/database/user-profile.model';
import { MlModel } from '@/modules/recommendation/infra/database/ml-model.model';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { ProfileMappingPlaceTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-food-type.model';
import { UserModel } from '@/modules/auth/infra/database/user.model';

import { IUserPreferenceRepository } from './domain/interfaces/repositories/user-preference-repository.interface';
import { IRecommendationService } from './domain/interfaces/services/recommendation-service.interface';

import { RestaurantRepository } from './infra/repositories/restaurants/restaurants.repository';
import { ReviewRepository } from './infra/repositories/reviews/reviews.repository';
import { UserPreferenceRepository } from './infra/repositories/user-preferences/user-preferences.repository';
import { RecommendationBasedOnboardingExternal } from './infra/external/recommendation-based-onboarding/recommendation-based-onboarding.external';

import { GetOnboardingRecommendationUseCase } from './app/use-cases/get-onboarding-recommendation.use-case';
import { SyncNearbyRestaurantsUseCase } from './app/use-cases/sync-nearby-restaurants.use-case';
import { RestaurantDiscoverySyncService } from './app/services/restaurant-discovery-sync.service';

import { RecommendationController } from './infra/controllers/recommendation.controller';
import { RecommendationsApiController } from './infra/controllers/recommendations-api.controller';
import { UserPreferencesController } from './infra/controllers/user-preferences.controller';
import { IRestaurantRepository } from './domain/interfaces/repositories/restaurant-repository.interface';
import { IReviewRepository } from './domain/interfaces/repositories/review-repository.interface';
import { PlacesProvider } from './domain/interfaces/places-provider.interface';
import { GooglePlacesProvider } from './infra/external/google-places/google-places.provider';
import { CandidateGenerationService } from './app/services/candidate-generation.service';
import { DefaultFeatureStore } from './app/services/default-feature-store.service';
import { FeatureStore } from './domain/interfaces/feature-store.interface';
import { RecommendationScorer } from './domain/interfaces/recommendation-scorer.interface';
import { RuleBasedRecommendationScorer } from './app/services/rule-based-recommendation-scorer.service';
import { TensorFlowRecommendationScorer } from './app/services/tensorflow-recommendation-scorer.service';
import { RecommendationSelectionService } from './app/services/recommendation-selection.service';
import { GenerateRecommendationsUseCase } from './app/use-cases/generate-recommendations.use-case';
import { ListRecommendationHistoryUseCase } from './app/use-cases/list-recommendation-history.use-case';
import { IRecommendationSessionRepository } from './domain/interfaces/repositories/recommendation-session-repository.interface';
import { RecommendationSessionRepository } from './infra/repositories/recommendation-sessions/recommendation-session.repository';
import { IRecommendationFeedbackRepository } from './domain/interfaces/repositories/recommendation-feedback-repository.interface';
import { RecommendationFeedbackRepository } from './infra/repositories/recommendation-feedback/recommendation-feedback.repository';
import { UserProfileLearningService } from './app/services/user-profile-learning.service';
import { GetUserPreferencesUseCase } from './app/use-cases/get-user-preferences.use-case';
import { UpsertUserPreferencesUseCase } from './app/use-cases/upsert-user-preferences.use-case';
import { RecordRecommendationFeedbackUseCase } from './app/use-cases/record-recommendation-feedback.use-case';
import { IMlModelRepository } from './domain/interfaces/repositories/ml-model-repository.interface';
import { MlModelRepository } from './infra/repositories/ml-models/ml-model.repository';
import { TrainingDatasetService } from './app/services/training-dataset.service';
import { GenerateTrainingDatasetUseCase } from './app/use-cases/generate-training-dataset.use-case';
import { MlDatasetController } from './infra/controllers/ml-dataset.controller';
import { ConfigService } from '@nestjs/config';
import { RecommendationStrategyConfigService } from './app/services/recommendation-strategy-config.service';
import { RecommendationMonitoringService } from './app/services/recommendation-monitoring.service';
import { PopularNearbyRecommendationScorer } from './app/services/popular-nearby-recommendation-scorer.service';
import { RecommendationMaintenanceService } from './app/services/recommendation-maintenance.service';
import { RecommendationMaintenanceSchedulerService } from './app/services/recommendation-maintenance-scheduler.service';
import { RecommendationDebugService } from './app/services/recommendation-debug.service';
import { RecommendationAdminController } from './infra/controllers/recommendation-admin.controller';
import { PredictionServiceHealthProbe } from './app/services/prediction-service-health-probe.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    SequelizeModule.forFeature([
      RestaurantsModel,
      ReviewModel,
      RecommendationInteractionModel,
      RecommendationFeedbackStateModel,
      RecommendationModel,
      RecommendationSessionModel,
      RestaurantRatingModel,
      UserPreferenceModel,
      UserProfileModel,
      MlModel,
      ProfileMappingModel,
      PlaceTypeModel,
      FoodTypeModel,
      ProfileMappingPlaceTypeModel,
      ProfileMappingFoodTypeModel,
      UserModel,
    ]),
  ],
  controllers: [
    RecommendationController,
    RecommendationsApiController,
    UserPreferencesController,
    MlDatasetController,
    RecommendationAdminController,
  ],
  providers: [
    {
      provide: IRestaurantRepository,
      useClass: RestaurantRepository,
    },
    {
      provide: IReviewRepository,
      useClass: ReviewRepository,
    },
    {
      provide: IUserPreferenceRepository,
      useClass: UserPreferenceRepository,
    },
    {
      provide: IRecommendationSessionRepository,
      useClass: RecommendationSessionRepository,
    },
    {
      provide: IRecommendationFeedbackRepository,
      useClass: RecommendationFeedbackRepository,
    },
    {
      provide: IMlModelRepository,
      useClass: MlModelRepository,
    },
    {
      provide: IRecommendationService,
      useClass: RecommendationBasedOnboardingExternal,
    },
    {
      provide: PlacesProvider,
      useClass: GooglePlacesProvider,
    },
    {
      provide: FeatureStore,
      useClass: DefaultFeatureStore,
    },
    RuleBasedRecommendationScorer,
    TensorFlowRecommendationScorer,
    PopularNearbyRecommendationScorer,
    {
      provide: RecommendationScorer,
      inject: [
        ConfigService,
        RuleBasedRecommendationScorer,
        TensorFlowRecommendationScorer,
      ],
      useFactory: (
        configService: ConfigService,
        ruleBasedScorer: RuleBasedRecommendationScorer,
        tensorFlowScorer: TensorFlowRecommendationScorer,
      ) =>
        configService.get<string>('RECOMMENDATION_SCORER') === 'tensorflow'
          ? tensorFlowScorer
          : ruleBasedScorer,
    },
    CandidateGenerationService,
    RestaurantDiscoverySyncService,
    RecommendationSelectionService,
    UserProfileLearningService,
    TrainingDatasetService,
    RecommendationStrategyConfigService,
    RecommendationMonitoringService,
    RecommendationMaintenanceService,
    RecommendationMaintenanceSchedulerService,
    RecommendationDebugService,
    PredictionServiceHealthProbe,
    GetOnboardingRecommendationUseCase,
    SyncNearbyRestaurantsUseCase,
    GenerateRecommendationsUseCase,
    ListRecommendationHistoryUseCase,
    GetUserPreferencesUseCase,
    UpsertUserPreferencesUseCase,
    RecordRecommendationFeedbackUseCase,
    GenerateTrainingDatasetUseCase,
  ],
  exports: [
    GetOnboardingRecommendationUseCase,
    SyncNearbyRestaurantsUseCase,
    GenerateRecommendationsUseCase,
    ListRecommendationHistoryUseCase,
    GetUserPreferencesUseCase,
    UpsertUserPreferencesUseCase,
    RecordRecommendationFeedbackUseCase,
    RestaurantDiscoverySyncService,
    IRestaurantRepository,
    IReviewRepository,
    IUserPreferenceRepository,
    IRecommendationSessionRepository,
    IRecommendationFeedbackRepository,
    IMlModelRepository,
    PlacesProvider,
    FeatureStore,
    RecommendationScorer,
  ],
})
export class RecommendationModule {}

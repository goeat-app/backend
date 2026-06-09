import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileMappingModule } from './modules/profile-mapping/profile-mapping.module';
import { DatabaseModule } from './lib/infra/database/database.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ProfileMappingModule,
    RecommendationModule,
  ],
})
export class AppModule {}

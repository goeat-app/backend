import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileMappingModule } from './modules/profile-mapping/profile-mapping.module';
import { IaModule } from './modules/ia/ia.module';
import { DatabaseModule } from './lib/infra/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ProfileMappingModule,
    IaModule,
  ],
})
export class AppModule {}

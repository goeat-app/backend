import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '@/modules/auth/auth.module';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { SupabaseStorageService } from '@/lib/infra/external/supabase-storage.service';
import { LocalDiskStorageService } from '@/lib/infra/external/local-storage.service';
import { RestaurantImageModel } from './infra/database/restaurant-image.model';
import { SequelizeRestaurantImageRepository } from './infra/repositories/restaurant-image.repository';
import { IRestaurantImageRepository } from './domain/interfaces/restaurant-image.repository.interface';
import { UploadRestaurantImageUseCase } from './app/use-cases/upload-restaurant-image.use-case';
import { DeleteRestaurantImageUseCase } from './app/use-cases/delete-restaurant-image.use-case';
import { RestaurantImagesController } from './infra/controllers/restaurant-images.controller';
import { RestaurantAccessModule } from '../restaurant-access/restaurant-access.module';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([RestaurantImageModel]),
    AuthModule,
    RestaurantAccessModule,
  ],
  controllers: [RestaurantImagesController],
  providers: [
    UploadRestaurantImageUseCase,
    DeleteRestaurantImageUseCase,
    {
      provide: IStorageService,
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        return nodeEnv === 'production'
          ? new SupabaseStorageService(configService)
          : new LocalDiskStorageService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: IRestaurantImageRepository,
      useClass: SequelizeRestaurantImageRepository,
    },
  ],
})
export class RestaurantImagesModule {}

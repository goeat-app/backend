import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '@/modules/auth/auth.module';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { FirebaseStorageService } from '@/lib/infra/firebase/firebase-storage.service';
import { RestaurantImageUrlResolver } from '@/lib/helpers/resolve-restaurant-image-url.helper';
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
    RestaurantImageUrlResolver,
    {
      provide: IStorageService,
      useFactory: (configService: ConfigService) => {
        return new FirebaseStorageService(configService);
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

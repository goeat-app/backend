import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './infra/database/user.model';
import { AuthController } from './infra/controllers/auth.controller';
import { IUserRepository } from './domain/interfaces/user.repository.interface';
import { SequelizeUserRepository } from './infra/repositories/user.repository';
import { AuthService } from './app/services/auth.service';
import { CreateUserUseCase } from './app/use-cases/register.use-case';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAuthGuard } from './infra/firebase/firebase-auth.guard';
import { ProfileController } from './infra/controllers/profile.controller';
import { UserProfileService } from './app/services/user-profile.service';

@Module({
  imports: [ConfigModule, SequelizeModule.forFeature([UserModel])],
  providers: [
    AuthService,
    CreateUserUseCase,
    FirebaseAuthGuard,
    UserProfileService,
    {
      provide: IUserRepository,
      useClass: SequelizeUserRepository,
    },
  ],
  controllers: [AuthController, ProfileController],
  exports: [IUserRepository, FirebaseAuthGuard, AuthService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { UserModel } from './infra/database/user.model';
import { AuthController } from './infra/controllers/auth.controller';
import { CreateUserUseCase } from './app/use-cases/register.use-case';
import { IUserRepository } from './domain/interfaces/user.repository.interface';
import { SequelizeUserRepository } from './infra/repositories/user.repository';
import { LoginUseCase } from './app/use-cases/login.use-case';
import { IHashService } from './domain/interfaces/hash.service.interface';
import { BcryptHashService } from './infra/providers/bycript-hash.service';
import { AuthService } from './app/services/auth.service';
import { jwtConstants } from './infra/jwt/constants';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './infra/jwt/jwt-auth.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret || 'default-secret-key',
      signOptions: { expiresIn: '3600s' },
    }),
  ],
  providers: [
    CreateUserUseCase,
    LoginUseCase,
    AuthService,
    JwtAuthGuard,
    {
      provide: IUserRepository,
      useClass: SequelizeUserRepository,
    },
    {
      provide: IHashService,
      useClass: BcryptHashService,
    },
  ],
  controllers: [AuthController],
  exports: [
    IUserRepository,
    CreateUserUseCase,
    JwtAuthGuard,
    LoginUseCase,
    AuthService,
  ],
})
export class AuthModule {}

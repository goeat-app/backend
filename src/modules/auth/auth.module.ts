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
import { RefreshTokenUseCase } from './app/use-cases/refresh-token.use-case';
import { JwtStrategy } from './infra/jwt/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback-secret',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    CreateUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
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

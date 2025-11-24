import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { LoginResponse } from '../../domain/entities/login.entity';
import { LoginUserDto } from '../../dtos/login-user.dto';
import { UserModel } from '../../infra/database/user.model';
import { LoginUseCase } from '../use-cases/login.use-case';
import { RefreshTokenUseCase } from '../use-cases/refresh-token.use-case';
import { RefreshTokenDto } from '../../dtos/refresh-token.dto';
import {
  PayloadRefreshToken,
  RefreshTokenResponse,
} from '../../domain/entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,

    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async login(dto: LoginUserDto): Promise<LoginResponse> {
    const user = await this.loginUseCase.execute(dto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken({
      username: user.email,
      sub: user.id,
    });
  }

  async refresh(dto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    const payload = this.jwtService.verify(dto.refreshToken);

    const { sub, email } = payload;

    const user = await this.refreshTokenUseCase.execute(
      email as string,
      sub as string,
    );

    return this.generateToken({
      username: user.userEmail,
      sub: user.userId,
    });
  }

  private async generateToken(
    payload: PayloadRefreshToken,
  ): Promise<RefreshTokenResponse> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '3600',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
    });

    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.update(
      { refreshToken: null },
      { where: { id: userId } },
    );
  }
}

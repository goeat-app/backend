import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { LoginResponse } from '../../domain/entities/login.entity';
import { LoginUserDto } from '../../dtos/login-user.dto';
import { UserModel } from '../../infra/database/user.model';
import { LoginUseCase } from '../use-cases/login.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly loginUseCase: LoginUseCase,
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async login(dto: LoginUserDto): Promise<LoginResponse> {
    const user = await this.loginUseCase.execute(dto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '3600',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    await this.userModel.update({ refreshToken }, { where: { id: user.id } });

    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.update(
      { refreshToken: null },
      { where: { id: userId } },
    );
  }
}

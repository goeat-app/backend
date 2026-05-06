import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { UpdateUserDto } from '../../dtos/update-user.dto';

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
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        username: string;
        type: 'access' | 'refresh';
        iat: number;
        exp: number;
      }>(dto.refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userModel.findByPk(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateToken({
        username: payload.username,
        sub: payload.sub,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserById(userId: string, data: UpdateUserDto) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const emailAlreadyInUse = await this.userModel.findOne({
      where: { email: data.email.toLowerCase() },
    });

    if (emailAlreadyInUse && emailAlreadyInUse.id !== userId) {
      throw new ConflictException('E-mail already in use');
    }

    if (data.cpf && user.cpf && user.cpf !== data.cpf) {
      throw new HttpException('CPF cannot be changed once defined', 400);
    }

    const cpf = user.cpf ?? data.cpf ?? null;

    await this.userModel.update(
      {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        birthDate: data.birthDate,
        cpf,
      },
      { where: { id: userId } },
    );

    return this.getUserById(userId);
  }

  private async generateToken(
    payload: PayloadRefreshToken,
  ): Promise<RefreshTokenResponse> {
    const accessToken = await this.jwtService.signAsync(
      { ...payload, type: 'access' },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      { expiresIn: '2h' },
    );

    await this.userModel.update(
      { refreshToken },
      { where: { id: payload.sub } },
    );

    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.update(
      { refreshToken: null },
      { where: { id: userId } },
    );
  }
}

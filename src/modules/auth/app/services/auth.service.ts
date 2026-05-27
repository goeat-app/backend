import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IHashService } from '../../domain/interfaces/hash.service.interface';
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
  private supabaseClient: SupabaseClient | null = null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashService: IHashService,
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

  async loginWithSupabaseAccessToken(
    accessToken: string,
  ): Promise<LoginResponse> {
    const client = this.getSupabaseClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid Supabase access token');
    }

    const email = data.user.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('Supabase account has no email');
    }

    let user = await this.userModel.findOne({
      where: { email },
    });

    if (!user) {
      user = await this.provisionSupabaseUser(email, data.user);
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

  private getSupabaseClient(): SupabaseClient {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new UnauthorizedException(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be configured',
      );
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    return this.supabaseClient;
  }

  private async provisionSupabaseUser(
    email: string,
    supabaseUser: { user_metadata?: unknown; phone?: string | null },
  ): Promise<UserModel> {
    const password = randomBytes(32).toString('hex');
    const hashedPassword = await this.hashService.hash(password);

    try {
      return await this.userModel.create({
        name: this.resolveSupabaseDisplayName(
          email,
          supabaseUser.user_metadata,
        ),
        email,
        phone:
          typeof supabaseUser.phone === 'string'
            ? supabaseUser.phone.trim()
            : '',
        password: hashedPassword,
      });
    } catch {
      console.error(
        `Failed to create user for email ${email} from Supabase login. Checking for existing user...`,
      );
      // Handles concurrent first-login requests for the same email.
      const existingUser = await this.userModel.findOne({
        where: { email },
      });

      if (existingUser) {
        return existingUser;
      }

      throw new InternalServerErrorException(
        'Unable to provision user for Google login',
      );
    }
  }

  private resolveSupabaseDisplayName(email: string, metadata: unknown): string {
    console.log('Resolving display name from Supabase metadata:', metadata);
    if (metadata && typeof metadata === 'object') {
      const record = metadata as Record<string, unknown>;
      const values = [record.full_name, record.name, record.preferred_username];

      for (const value of values) {
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }

    const emailLocalPart = email.split('@')[0]?.trim();
    return emailLocalPart || 'GoEat User';
  }
}

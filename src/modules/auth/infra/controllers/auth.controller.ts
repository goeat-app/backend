import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../app/use-cases/register.use-case';
import { RegisterUserDto } from '../../dtos/register-user.dto';
import { LoginUserDto } from '../../dtos/login-user.dto';
import { AuthService } from '../../app/services/auth.service';
import { LoginResponse } from '../../domain/entities/login.entity';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import {
  LogoutParam,
  LogoutResponse,
} from '../../domain/entities/logout.entity';
import { RefreshTokenDto } from '../../dtos/refresh-token.dto';
import { RefreshTokenResponse } from '../../domain/entities/refresh-token.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(201)
  async create(@Body() registerData: RegisterUserDto): Promise<LoginResponse> {
    await this.createUserUseCase.execute(registerData);

    return this.authService.login({
      email: registerData.email,
      password: registerData.password,
    });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginData: LoginUserDto): Promise<LoginResponse> {
    const token = await this.authService.login(loginData);

    return token;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshTokenDto): Promise<RefreshTokenResponse> {
    const tokens = await this.authService.refresh(body);
    return tokens;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & LogoutParam) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.authService.getUserById(req.user.id);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request & LogoutParam): Promise<LogoutResponse> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.authService.logout(req.user.id);

    return { message: 'Logged out successfully' };
  }
}

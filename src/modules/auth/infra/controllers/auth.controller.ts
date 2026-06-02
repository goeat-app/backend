import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../../app/services/auth.service';
import { CreateUserUseCase } from '../../app/use-cases/register.use-case';
import { RegisterUserDto } from '../../dtos/register-user.dto';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto) {
    return this.createUserUseCase.execute(body);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user?: { id?: string } }) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.authService.getUserById(req.user.id);
    return user;
  }
}

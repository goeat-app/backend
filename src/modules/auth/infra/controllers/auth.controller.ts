import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../../app/services/auth.service';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { UserModel } from '../database/user.model';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: UserModel }) {
    if (!req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.authService.getUserById(req.user.id);
    return user;
  }
}

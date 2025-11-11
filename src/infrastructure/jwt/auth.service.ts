import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const match = await bcrypt.compare(pass, (user as any).password || '');
    if (match) {
      const { password, ...result } = (user as any).get ? (user as any).get({ plain: true }) : user;
      return result;
    }
    return null;
  }

  async login(user: { id: number; email: string }) {
    const payload = { sub: user.id, email: user.email, tokenVersion: (user as any).tokenVersion };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(userId: number) {
    await this.usersService.incrementTokenVersion(userId);
    return { success: true };
  }
}

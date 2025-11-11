import { Controller, Get, Post, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.model';
import { JwtAuthGuard } from '../infrastructure/jwt/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get("users")
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req) {
    
  const id = (req.user as any)?.id;
  if (!id) throw new NotFoundException('User not found');
  const user = await this.userService.findById(id);
  if (!user) throw new NotFoundException('User not found');
    const plain = (user as any).get ? (user as any).get({ plain: true }) : user;
    
    delete plain.password;
    delete plain.tokenVersion;
    return plain;
  }

  @Post('register')
  async create(@Body() user: Partial<User>): Promise<Partial<User>> {
    return this.userService.create(user);
  }
}
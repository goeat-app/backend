import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.model';
import { syncTables } from '../infrastructure/database/sync-tables';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post('register')
  async create(@Body() user: Partial<User>): Promise<Partial<User>> {
    return this.userService.create(user);
  }
}
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.model';
import { syncTables } from '../infrastructure/database/sync-tables';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post()
  async create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }
}
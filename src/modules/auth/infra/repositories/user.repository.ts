import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../database/user.model';
import { RegisterUser } from '../../domain/entities/register-user.entity';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { RegisterUserDto } from '../../dtos/register-user.dto';

@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async create(data: RegisterUser): Promise<void> {
    await this.userModel.create({
      name: data?.name,
      email: data?.email,
      password: data?.password,
      phone: data?.phone,
    });
  }

  async findByEmail(email: string): Promise<RegisterUser | null> {
    const user = await this.userModel.findOne({
      where: { email },
    });

    return user ?? null;
  }
}

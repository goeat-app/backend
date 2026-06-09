import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../database/user.model';
import {
  IUserRepository,
  CreateUserData,
} from '../../domain/interfaces/user.repository.interface';
import { RegisterUser } from '../../domain/entities/register-user.entity';
import { Op } from 'sequelize';

@Injectable()
export class SequelizeUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async create(data: CreateUserData): Promise<void> {
    await this.userModel.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      firebaseUid: data.firebaseUid ?? null,
    });
  }

  async findByEmail(email: string): Promise<RegisterUser | null> {
    const user = await this.userModel.findOne({
      where: {
        email: {
          // case insensitive search for email
          [Op.iLike]: email,
        },
      },
    });

    return user ?? null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<RegisterUser | null> {
    const user = await this.userModel.findOne({
      where: { firebaseUid },
    });

    return user ?? null;
  }

  async findById(id: string): Promise<RegisterUser | null> {
    const user = await this.userModel.findOne({
      where: { id },
    });

    return user ?? null;
  }

  async updateFirebaseUid(id: string, firebaseUid: string): Promise<void> {
    await this.userModel.update(
      { firebaseUid },
      {
        where: { id },
      },
    );
  }
}

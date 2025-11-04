import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async create(user: Partial<User>): Promise<Partial<User>> {
    const saltRounds = 10;
    const password = (user.password as unknown as string) || '';
    const hash = await bcrypt.hash(password, saltRounds);

    const created = await this.userModel.create({
      ...user,
      password: hash,
    } as any);

    // Return created user without password
    const plain = created.get({ plain: true }) as any;
    delete plain.password;
    return plain;
  }
}
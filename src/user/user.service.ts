import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { sequelize } from '../infrastructure/database/sequelize-instance';
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

  async findById(id: string): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async incrementTokenVersion(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;
    try {
      await user.update({ tokenVersion: ((user as any).tokenVersion || 0) + 1 } as any);
    } catch (err: any) {
      const msg = err && err.message ? err.message : '';
      if (msg.includes('Unknown column') || msg.includes('ER_NO_SUCH_COLUMN') || msg.includes('ER_BAD_FIELD_ERROR')) {
        await sequelize.query("ALTER TABLE `user` ADD COLUMN `tokenVersion` INT DEFAULT 0;");
        await user.update({ tokenVersion: ((user as any).tokenVersion || 0) + 1 } as any);
        return;
      }
      throw err;
    }
  }

  async create(user: Partial<User>): Promise<Partial<User>> {
    const saltRounds = 10;
    const password = (user.password as unknown as string) || '';
    const hash = await bcrypt.hash(password, saltRounds);

    const payload: any = {
      name: (user as any).name,
      email: (user as any).email,
      phone: (user as any).phone,
      password: hash,
    };

  const created = await this.userModel.create(payload as any, { fields: ['name', 'email', 'password', 'phone'] });

    const plain = created.get({ plain: true }) as any;
    delete plain.password;
    return plain;
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../../infra/database/user.model';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async updateUser(data: {
    name?: string;
    phone?: string;
    firebaseUid: string;
  }) {
    // Try finding the user by firebaseUid, retry three times in case the user registration process is still propagating the firebaseUid to the database
    let userEntry: UserModel | null = null;

    if (!userEntry) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise(
          (resolve) => setTimeout(resolve, attempt * 1000), // Exponential backoff
        );
        userEntry = await this.userModel.findOne({
          where: { firebaseUid: data.firebaseUid },
          attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
        });

        if (userEntry) {
          break;
        }
      }
    }

    if (!userEntry) {
      throw new NotFoundException(
        `User with Firebase UID ${data.firebaseUid} not found after multiple attempts.`,
      );
    }

    await this.userModel.update(data, {
      where: { firebaseUid: data.firebaseUid },
    });

    const updatedUser = await this.userModel.findByPk(userEntry.id, {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });

    return updatedUser;
  }
}

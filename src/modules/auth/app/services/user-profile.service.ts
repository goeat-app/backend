import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../../infra/database/user.model';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async updateUser(data: { name?: string; phone?: string; user: UserModel }) {
    const userEntry = await this.userModel.findOne({
      where: { firebaseUid: data.user.firebaseUid },
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });

    if (!userEntry) {
      throw new NotFoundException(
        `User with Firebase UID ${data.user.firebaseUid} not found.`,
      );
    }

    //update firebase user name
    if (userEntry.firebaseUid) {
      await getAuth().updateUser(userEntry.firebaseUid, {
        displayName: data.name,
        // TODO add country code to phone number
        // phoneNumber: data.phone,
      });
    }

    await this.userModel.update(data, {
      where: { firebaseUid: data.user.firebaseUid },
    });

    const updatedUser = await this.userModel.findByPk(userEntry.id, {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });

    return updatedUser;
  }
}

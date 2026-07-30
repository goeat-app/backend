import {
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/sequelize';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UniqueConstraintError } from 'sequelize';
import { UserModel } from '../../infra/database/user.model';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}

  async resolveUserFromFirebaseToken(decodedToken: DecodedIdToken) {
    const byFirebaseUid = await this.userModel.findOne({
      where: { firebaseUid: decodedToken.uid },
    });

    if (byFirebaseUid) {
      return byFirebaseUid;
    }

    const email = this.normalizeEmail(decodedToken.email);

    if (!email) {
      throw new ForbiddenException('Email-based identity required.');
    }

    const userByEmail = await this.userModel.findOne({ where: { email } });

    if (userByEmail && decodedToken.email_verified === true) {
      try {
        await userByEmail.update({ firebaseUid: decodedToken.uid });
      } catch (error) {
        if (this.isFirebaseUidUniqueViolation(error)) {
          const existing = await this.userModel.findOne({
            where: { firebaseUid: decodedToken.uid },
          });

          if (existing) {
            return existing;
          }
        }

        throw error;
      }

      return userByEmail;
    }

    if (userByEmail && decodedToken.email_verified !== true) {
      console.warn(
        `Firebase login for ${email} has unverified email; creating an unlinked user record.`,
      );
    }

    return this.provisionFirebaseUser(
      decodedToken,
      email,
      Boolean(userByEmail),
    );
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileMapping = await ProfileMappingModel.findOne({
      where: { userId },
    });

    if (!profileMapping) {
      return {
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasCompletedProfile: false,
      };
    }

    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      hasCompletedProfile: true,
    };
  }

  private async provisionFirebaseUser(
    decodedToken: DecodedIdToken,
    normalizedEmail: string,
    emailAlreadyExists: boolean,
  ): Promise<UserModel> {
    const emailToPersist = emailAlreadyExists
      ? this.buildDerivedEmail(normalizedEmail, decodedToken.uid)
      : normalizedEmail;

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const userById = await this.userModel.findOne({
      where: { firebaseUid: decodedToken.uid },
    });

    if (userById) {
      return userById;
    }

    try {
      return await this.userModel.create({
        name: this.resolveDisplayName(decodedToken.name, normalizedEmail),
        email: emailToPersist,
        phone:
          typeof decodedToken.phone_number === 'string'
            ? decodedToken.phone_number.trim()
            : '',
        password: randomBytes(32).toString('hex'),
        firebaseUid: decodedToken.uid,
      });
    } catch (error) {
      console.error('Error provisioning Firebase user:', error);
      if (this.isFirebaseUidUniqueViolation(error)) {
        const existingUser = await this.userModel.findOne({
          where: { firebaseUid: decodedToken.uid },
        });

        if (existingUser) {
          return existingUser;
        }
      }

      throw new InternalServerErrorException(
        'Unable to provision user for Firebase login',
      );
    }
  }

  private normalizeEmail(email?: string | null): string | null {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const normalized = email.trim().toLowerCase();
    return normalized || null;
  }

  private resolveDisplayName(displayName: unknown, email: string): string {
    if (typeof displayName === 'string' && displayName.trim()) {
      return displayName.trim();
    }

    const [localPart] = email.split('@');
    if (localPart?.trim()) {
      return localPart.trim();
    }

    return 'GoEat User';
  }

  private buildDerivedEmail(email: string, firebaseUid: string): string {
    const atIndex = email.indexOf('@');

    if (atIndex === -1) {
      return `${email}+firebase-${firebaseUid}`;
    }

    const localPart = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);
    return `${localPart}+firebase-${firebaseUid}@${domain}`;
  }

  private isFirebaseUidUniqueViolation(error: unknown): boolean {
    if (!(error instanceof UniqueConstraintError)) {
      return false;
    }

    return error.errors.some(
      (constraintError) => constraintError.path === 'firebase_uid',
    );
  }
}

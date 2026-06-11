import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/register-user.dto';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { getAuth } from 'firebase-admin/auth';

export interface RegisterResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: RegisterUserDto): Promise<void> {
    const { firebaseUid } = data;
    const firebaseUser = await getAuth()
      .getUser(firebaseUid)
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to retrieve Firebase user with UID ${firebaseUid}`,
          error,
        );
        throw new HttpException(
          { message: 'Registration failed. Please try again.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

    if (!firebaseUser) {
      this.logger.error(`Firebase user with UID ${firebaseUid} not found`);
      throw new HttpException(
        { message: 'Registration failed. Please try again.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!firebaseUser.email) {
      this.logger.error(`Firebase user with UID ${firebaseUid} has no email`);
      throw new HttpException(
        { message: 'Registration failed. Please try again.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const normalizedEmail = firebaseUser.email?.toLowerCase().trim();
    const [existingUser, existingUserByFirebaseUid] = await Promise.all([
      this.userRepository.findByEmail(normalizedEmail),
      this.userRepository.findByFirebaseUid(firebaseUid),
    ]);

    if (existingUser || existingUserByFirebaseUid) {
      throw new HttpException(
        { message: 'An account with this email already exists.' },
        HttpStatus.CONFLICT,
      );
    }
    const userName = firebaseUser.displayName ?? normalizedEmail.split('@')[0];

    try {
<<<<<<< HEAD
=======
      const firebaseUser = await getAuth().createUser({
        email: normalizedEmail,
        password,
        displayName: name,
        phoneNumber: phone,
      });

<<<<<<< HEAD
    await this.userRepository.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      latitude: data.latitude,
      longitude: data.longitude,
    });
=======
>>>>>>> c4e5af00e129ce6c456d00f1277622b45ea7e8e5
      try {
        await this.userRepository.create({
          name: userName,
          email: normalizedEmail,
          // The password is not stored in our database since Firebase handles authentication.
          password: '',
          firebaseUid: firebaseUid,
          phone: null,
        });
      } catch (dbError) {
        this.logger.error(
          `DB create failed for ${normalizedEmail}; rolling back Firebase user ${firebaseUid}`,
          dbError,
        );
        await getAuth()
          .deleteUser(firebaseUid)
          .catch((e: unknown) =>
            this.logger.error('Firebase rollback failed', e),
          );
        throw new HttpException(
          { message: 'Registration failed. Please try again.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (firebaseError) {
      this.logger.error(
        `Firebase user creation failed for ${normalizedEmail}`,
        firebaseError,
      );

      throw new HttpException(
        { message: 'Registration failed. Please try again.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
>>>>>>> 12f5bbbe2e4ee1757f4871ca905e376d63feed9d
  }
}

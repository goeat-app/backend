import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/register-user.dto';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { getAuth } from 'firebase-admin/auth';

export interface RegisterResult {
  customToken: string;
}

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: RegisterUserDto): Promise<RegisterResult> {
    const { name, email, phone, password } = data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new HttpException(
        { message: 'An account with this email already exists.' },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const firebaseUser = await getAuth().createUser({
        email: normalizedEmail,
        password,
        displayName: name,
        phoneNumber: phone,
      });

      try {
        await this.userRepository.create({
          name,
          email: normalizedEmail,
          phone,
          // The password is not stored in our database since Firebase handles authentication.
          password: '',
          firebaseUid: firebaseUser.uid,
        });
      } catch (dbError) {
        this.logger.error(
          `DB create failed for ${normalizedEmail}; rolling back Firebase user ${firebaseUser.uid}`,
          dbError,
        );
        await getAuth()
          .deleteUser(firebaseUser.uid)
          .catch((e: unknown) =>
            this.logger.error('Firebase rollback failed', e),
          );
        throw new HttpException(
          { message: 'Registration failed. Please try again.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const customToken = await getAuth().createCustomToken(firebaseUser.uid);
      return { customToken };
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
  }
}

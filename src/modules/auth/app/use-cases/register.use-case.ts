import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FirebaseAuthClientService } from '../services/firebase-auth-client.service';
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

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly firebaseAuthClientService: FirebaseAuthClientService,
  ) {}

  async execute(data: RegisterUserDto): Promise<RegisterResult> {
    const { name, email, phone, password } = data;
    const normalizedEmail = email.toLowerCase().trim();
    const phoneNumber = this.addCountryCodeToPhone(phone);

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
        phoneNumber: phoneNumber,
      });

      try {
        await this.userRepository.create({
          name,
          email: normalizedEmail,
          phone: phoneNumber,
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

      return this.firebaseAuthClientService.signInWithPassword(
        normalizedEmail,
        password,
      );
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

  private addCountryCodeToPhone(phone: string): string {
    if (phone.startsWith('+')) {
      return phone; // Already has country code
    }
    return `+55${phone}`; // Default to Brazil country code
  }
}

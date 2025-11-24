import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    email: string,
    sub: string,
  ): Promise<{ userEmail: string; userId: string }> {
    try {
      const userEmail = await this.userRepository.findByEmail(email);

      if (!userEmail) {
        throw new UnauthorizedException('User not found');
      }

      const userId = await this.userRepository.findById(sub);

      if (!userId) {
        throw new UnauthorizedException('User ID not found');
      }

      return { userEmail: userEmail.email, userId: userId.id };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}

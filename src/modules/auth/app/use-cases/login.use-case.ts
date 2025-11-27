import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { LoginUserDto } from '../../dtos/login-user.dto';
import { IHashService } from '../../domain/interfaces/hash.service.interface';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
  ) {}

  async execute(dto: LoginUserDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS',
        field: 'email',
      });
    }

    const match = await this.hashService.compare(dto.password, user.password);

    if (!match) {
      throw new UnauthorizedException({
        message: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS',
        field: 'password',
      });
    }

    return user;
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../../dtos/register-user.dto';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: RegisterUserDto): Promise<void> {
    const { name, email, phone, password } = data;

    if (!name || !email || !password || !phone) {
      throw new HttpException('Missing required fields', 400);
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new HttpException('User already exists', 409);
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    await this.userRepository.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
    });
  }
}

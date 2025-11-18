import { RegisterUserDto } from '../../dtos/register-user.dto';
import { RegisterUser } from '../entities/register-user.entity';

export abstract class IUserRepository {
  abstract create(data: RegisterUserDto): Promise<void>;

  abstract findByEmail(email: string): Promise<RegisterUser | null>;
}

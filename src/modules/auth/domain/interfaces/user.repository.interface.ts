import { RegisterUser } from '../entities/register-user.entity';

export type CreateUserData = {
  name: string;
  email: string;
  password: string;
  phone: string | null;
  firebaseUid?: string | null;
};

export abstract class IUserRepository {
  abstract create(data: CreateUserData): Promise<void>;

  abstract findByEmail(email: string): Promise<RegisterUser | null>;

  abstract findByFirebaseUid(firebaseUid: string): Promise<RegisterUser | null>;

  abstract findById(id: string): Promise<RegisterUser | null>;

  abstract updateFirebaseUid(id: string, firebaseUid: string): Promise<void>;
}

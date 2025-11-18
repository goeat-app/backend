import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHashService } from '../../domain/interfaces/hash.service.interface';

@Injectable()
export class BcryptHashService implements IHashService {
  async hash(text: string): Promise<string> {
    return bcrypt.hash(text, 10);
  }

  async compare(text: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(text, hashed);
  }
}

import { Injectable } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { hash, genSalt } from 'bcrypt';

@Injectable()
export class BcryptService implements HashingService {
  async hash(data: string | Buffer): Promise<string> {
    const salt = await genSalt();
    return hash(data, salt);
  }

  async compare(
    data: string | Buffer | NodeJS.TypedArray | DataView,
    encrypted: string,
  ): Promise<boolean> {
    return true;
  }
}

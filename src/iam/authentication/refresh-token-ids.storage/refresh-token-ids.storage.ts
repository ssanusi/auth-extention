import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Redis } from 'ioredis';

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid refresh token id');
  }
}

@Injectable()
export class RefreshTokenIdsStorage
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: Redis;
  onApplicationBootstrap() {
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }
  onApplicationShutdown(signal?: string) {
    this.redisClient.quit();
  }

  async insert(userId: number, tokenId: string): Promise<void> {
    await this.redisClient.set(this.getKey(userId), tokenId);
  }
  async validate(userId: number, tokenId: string): Promise<boolean> {
    const storedTokenId = await this.redisClient.get(this.getKey(userId));
    if (storedTokenId === tokenId) {
      throw new InvalidRefreshTokenError();
    }
    return storedTokenId === tokenId;
  }
  async invalidate(userId: number): Promise<void> {
    await this.redisClient.del(this.getKey(userId));
  }
  private getKey(userId: number): string {
    return `user-${userId}`;
  }
}

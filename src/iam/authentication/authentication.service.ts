import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { IActiveUserData } from '../interface/active-user-data.interface';
import { refreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
    try {
      const { email, password, fullName } = signUpDto;
      const hashedPassword = await this.hashingService.hash(password);
      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        fullName,
      });
      return this.usersRepository.save(user);
    } catch (error: any) {
      const { code } = error;
      const pgUniqueConstraintErrorCode = '23505';
      if (code === pgUniqueConstraintErrorCode) {
        throw new ConflictException('Email already exists');
      }
    }
  }

  async signIn(signInDto: SignInDto): Promise<Record<string, string>> {
    const { email, password } = signInDto;
    const user = await this.usersRepository.findOne({ where: { email } });
    const isPasswordValid = await this.hashingService.compare(
      password,
      user?.password,
    );
    if (!user || !isPasswordValid) {
      throw new ConflictException('Invalid credentials');
    }
    return await this.generateTokens(user);
  }

  public async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<IActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTTL,
        { email: user.email },
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTTL),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  public async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: expiresIn,
      },
    );
  }

  async refreshToken(refreshTokenDto: refreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync<
        Pick<IActiveUserData, 'sub'>
      >(refreshTokenDto.refreshToken, {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
      });
      const user = await this.usersRepository.findOneByOrFail({
        id: sub,
      });
      return await this.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

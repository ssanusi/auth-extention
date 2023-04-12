import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
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

  async signIn(signInDto: SignInDto): Promise<User> {
    const { email, password } = signInDto;
    const user = await this.usersRepository.findOne({ where: { email } });
    const isPasswordValid = await this.hashingService.compare(
      password,
      user?.password,
    );
    if (!user || !isPasswordValid) {
      throw new ConflictException('Invalid credentials');
    }
    return user;
  }
}

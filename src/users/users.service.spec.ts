import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'database';
import { instance, mock } from 'ts-mockito';
import { EntityRepository, Repository } from 'typeorm';
import { User } from './model';
import { UsersService } from './users.service';
import { VerificationService } from './verification.service';
import { MailTemplateService } from 'mail-template';

describe('UsersService', () => {
  let service: UsersService;
  let verificationServiceMock: VerificationService;
  let mailServiceMock: MailTemplateService;

  beforeEach(async () => {
    verificationServiceMock = mock<VerificationService>(VerificationService);
    mailServiceMock = mock<MailTemplateService>(MailTemplateService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, TypeOrmModule.forFeature([User])],
      providers: [
        UsersService,
        {
          provide: VerificationService,
          useValue: instance(verificationServiceMock),
        },
        {
          provide: MailTemplateService,
          useValue: instance(mailServiceMock),
        }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a different value after hash', async () => {
    const plainTextPassword = 'test';

    const passwordHash = await service.hashPassword(plainTextPassword);

    expect(passwordHash).toBeDefined();
    expect(passwordHash).not.toBeNull();
    expect(passwordHash).not.toEqual(plainTextPassword);
  });

  it('should be able to verify a hashed password', async () => {
    const plainTextPassword = 'test';

    const passwordHash = await service.hashPassword(plainTextPassword);
    const user = Object.assign(new User(), { passwordHash });

    const result = service.verifyPassword(plainTextPassword, user);

    expect(result).toBeTruthy();
  });
});

@EntityRepository(User)
class MockRepository extends Repository<User> { }

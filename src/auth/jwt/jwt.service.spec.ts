import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'config';
import { LoggedUserDto, UserRoles } from 'users';
import { JwtPassportService } from './jwt.service';

const EXPIRES_IN = '10s';

describe('JwtPassportService', () => {
  let service: JwtPassportService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtPassportService,
        {
          provide: JwtService,
          useValue: {
            sign: (payload) => {
              // Nothing to do
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: (key) => key === 'LOGIN_JWT_EXPIRES_IN' ? EXPIRES_IN : 'secret' },
        },
      ],
    }).compile();

    service = module.get<JwtPassportService>(JwtPassportService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('.generateToken()', () => {
    const user: LoggedUserDto = { email: 'testuser', id: 23, role: UserRoles.User };
    const expectedToken = 'thisisatoken';

    it('should return signed payload', async () => {
      const signMock = jest.spyOn(jwtService, 'sign');
      signMock.mockImplementationOnce((payload: string) => expectedToken);

      const token = await service.generateToken(user);
      expect(signMock).toHaveBeenCalledTimes(1);

      expect(signMock).toHaveBeenCalledWith({
        username: user.email,
        sub: user.id,
      });

      expect(token).toEqual({ access_token: expectedToken, token_type: 'Bearer', expires_in: EXPIRES_IN });

      signMock.mockRestore();
    });
  });
});

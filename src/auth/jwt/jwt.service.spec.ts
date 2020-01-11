import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggedUserDto, UserRoles } from 'users';
import { JwtPassportService } from './jwt.service';

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
      ],
    }).compile();

    service = module.get<JwtPassportService>(JwtPassportService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('.parseToken()', () => {
    const expectedUser: LoggedUserDto = { username: 'testuser', id: 23, role: UserRoles.User };
    const tokenPayload = { username: expectedUser.username, sub: expectedUser };

    it('should parse logged user from token', () => {
      const actualUser = service.parseToken(tokenPayload);

      expect(actualUser).toEqual(expectedUser);
    });
  });

  describe('.generateToken()', () => {
    const user: LoggedUserDto = { username: 'testuser', id: 23, role: UserRoles.User };
    const expectedToken = 'thisisatoken';

    it('should return signed payload', async () => {
      const signMock = jest.spyOn(jwtService, 'sign');
      signMock.mockImplementationOnce((payload: string) => expectedToken);

      const token = await service.generateToken(user);
      expect(signMock).toHaveBeenCalledTimes(1);

      expect(signMock).toHaveBeenCalledWith({
        username: user.username,
        sub: user,
      });

      expect(token).toEqual({ access_token: expectedToken });

      signMock.mockRestore();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'config';
import { LoggedUserDto, UserRoles } from 'users';
import { TokenPayload } from './dto';
import { JwtPassportService } from './jwt.service';
import { JwtPassportStrategy } from './jwt.strategy';

describe('JwtPassportStrategy', () => {
  let strategy: JwtPassportStrategy;
  let service: JwtPassportService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtPassportStrategy,
        {
          provide: JwtPassportService,
          useValue: {
            parseToken: () => { // nothing } },
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'secret' },
        },
      ],
    }).compile();

    service = module.get<JwtPassportService>(JwtPassportService);
    strategy = module.get<JwtPassportStrategy>(JwtPassportStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('.validate()', () => {
    const expectedLoggedUser: LoggedUserDto = { username: 'testuser', id: 23, role: UserRoles.User };
    const tokenPayload: TokenPayload = { username: 'it doesnt matter. should only redrive to mock', sub: null };

    it('should validate token with service', async () => {
      const parseTokenMock = jest.spyOn(service, 'parseToken');
      parseTokenMock.mockImplementationOnce((payload: TokenPayload) => expectedLoggedUser);

      const loggedUser = await strategy.validate(tokenPayload);

      expect(parseTokenMock).toHaveBeenCalledTimes(1);

      expect(parseTokenMock).toHaveBeenCalledWith(tokenPayload);

      expect(loggedUser).toEqual(expectedLoggedUser);

      parseTokenMock.mockRestore();
    });
  });
});

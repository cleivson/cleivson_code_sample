import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost, Type } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { instance, mock, when } from 'ts-mockito';
import { LoggedUserDto } from 'users';
import { NEEDED_ROLE_METADATA } from '../decorators/roles.constants';
import { RolesGuard } from './roles.guard';
import { UserRoles } from '../model/users.roles';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflectorMock: Reflector;

  beforeEach(async () => {
    reflectorMock = mock(Reflector);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, {
        provide: Reflector,
        useValue: instance(reflectorMock),
      }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let contextMock: ExecutionContext;
    let httpArgumentsHostMock: HttpArgumentsHost;
    let loggedUser: LoggedUserDto;
    const getHandlerResult = () => 'getHandlerResult';
    const getClassResult: Type<string> = null;

    let context: ExecutionContext;
    let specificEndpointRoles: UserRoles[];
    let controllerRoles: UserRoles[];

    beforeEach(() => {
      contextMock = mock<ExecutionContext>();
      httpArgumentsHostMock = mock<HttpArgumentsHost>();
      loggedUser = mock<LoggedUserDto>();

      context = instance(contextMock);

      when(contextMock.getHandler()).thenReturn(getHandlerResult);
      when(contextMock.getClass()).thenReturn(getClassResult);
      when(contextMock.switchToHttp()).thenReturn(instance(httpArgumentsHostMock));
      when(httpArgumentsHostMock.getRequest<any>()).thenReturn({ user: instance(loggedUser) });
    });

    describe('with specific roles for endpoint', () => {
      beforeEach(() => {
        specificEndpointRoles = [UserRoles.Admin, UserRoles.UserManager];
        controllerRoles = [UserRoles.Admin];
        when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getHandlerResult)).thenReturn(specificEndpointRoles);
        when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
      });

      it('should consider only endpoint roles', async () => {
        const resultAssertion = (role: UserRoles) => specificEndpointRoles.includes(role);

        await testValidateForAllRoles(guard, loggedUser, context, resultAssertion);
      });
    });

    describe('with empty specific roles for endpoint', () => {
      beforeEach(() => {
        specificEndpointRoles = [];
        when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getHandlerResult)).thenReturn(specificEndpointRoles);
      });

      describe('with roles for controller', () => {
        beforeEach(() => {
          controllerRoles = [UserRoles.User, UserRoles.Admin];
          when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
        });

        it('should use controller roles', async () => {
          const resultAssertion = (role: UserRoles) => controllerRoles.includes(role);

          await testValidateForAllRoles(guard, loggedUser, context, resultAssertion);
        });
      });

      describe('with empty roles for controller', () => {
        beforeEach(() => {
          controllerRoles = [];
          when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
        });

        it('should authorize any user', async () => {
          await testValidateForAllRoles(guard, loggedUser, context, () => true);
        });
      });

      describe('with no role guard for controller', () => {
        beforeEach(() => {
          controllerRoles = undefined;
          when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
        });

        it('should authorize any user', async () => {
          await testValidateForAllRoles(guard, loggedUser, context, () => true);
        });
      });
    });

    describe('with no role guard for endpoint', () => {
      beforeEach(() => {
        specificEndpointRoles = undefined;
        when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getHandlerResult)).thenReturn(specificEndpointRoles);
      });

      describe('with roles for controller', () => {
        beforeEach(() => {
          controllerRoles = [UserRoles.User, UserRoles.Admin];
          when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
        });

        it('should use controller roles', async () => {
          const resultAssertion = (role: UserRoles) => controllerRoles.includes(role);

          await testValidateForAllRoles(guard, loggedUser, context, resultAssertion);
        });
      });

      describe('with empty roles for controller', () => {
        beforeEach(() => {
          controllerRoles = [];
          when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
        });

        it('should authorize any user', async () => {
          await testValidateForAllRoles(guard, loggedUser, context, () => true);
        });
      });

      describe('with no role guard for controller', () => {
        beforeEach(() => {
          controllerRoles = undefined;
          when(reflectorMock.get<UserRoles[]>(NEEDED_ROLE_METADATA, getClassResult)).thenReturn(controllerRoles);
        });

        it('should authorize any user', async () => {
          await testValidateForAllRoles(guard, loggedUser, context, () => true);
        });
      });
    });
  });
});

async function testValidateForAllRoles(guard: RolesGuard,
                                       loggedUser: LoggedUserDto,
                                       context: ExecutionContext,
                                       roleAssertion: (user: UserRoles) => boolean) {
  const allRoles = Object.keys(UserRoles);

  for (const roleName of allRoles) {
    const role: UserRoles = UserRoles[roleName];
    when(loggedUser.role).thenReturn(role);
    const result = await guard.canActivate(context);
    expect(result).toEqual(roleAssertion(role));
  }
}

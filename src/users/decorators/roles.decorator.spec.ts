import * as common from '@nestjs/common';
import { UserRoles } from 'users';
import { NEEDED_ROLE_METADATA } from './roles.constants';
import { Roles } from './roles.decorator';

describe('Roles decorator', () => {
  let SetMetadataSpy: jest.SpyInstance;

  beforeEach(() => {
    SetMetadataSpy = jest.spyOn(common, 'SetMetadata');
  });

  it('should set roles metadata', () => {
    Roles(UserRoles.User, UserRoles.Admin);

    expect(SetMetadataSpy).toBeCalledWith(NEEDED_ROLE_METADATA, [UserRoles.User, UserRoles.Admin]);
  });
});

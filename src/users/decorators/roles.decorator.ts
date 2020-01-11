import { SetMetadata } from '@nestjs/common';
import { UserRoles } from 'users';
import { NEEDED_ROLE_METADATA } from './roles.constants';

export const Roles = (...roles: UserRoles[]) => SetMetadata(NEEDED_ROLE_METADATA, roles);

import { LockedAccountException, UnverifiedEmailException } from 'auth/exceptions';
import { User } from 'users';

export const validateUser = (user: User) => {
  if (user.locked) {
    throw new LockedAccountException();
  }

  if (!user.verified) {
    throw new UnverifiedEmailException();
  }
};

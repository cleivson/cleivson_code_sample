import { UserRoles } from 'users';
import { NEEDED_ROLE_METADATA } from './roles.constants';
import { Roles } from './roles.decorator';

describe('Roles decorator', () => {
  describe('Class with roles', () => {
    const classRoles = [UserRoles.Admin, UserRoles.User];

    @Roles(...classRoles)
    class ClassWithRoles {
      // tslint:disable-next-line: no-empty
      methodWithoutRoles() {}
    }

    it('should set class metadata', () => {
      const instance = new ClassWithRoles();

      const classMetadata = Reflect.getMetadata(NEEDED_ROLE_METADATA, ClassWithRoles);
      const methodMetadata = Reflect.getMetadata(NEEDED_ROLE_METADATA, instance.methodWithoutRoles);
      const instanceMetadata = Reflect.getMetadata(NEEDED_ROLE_METADATA, instance);

      expect(classMetadata).toStrictEqual(classRoles);
      expect(methodMetadata).toBeUndefined();
      expect(instanceMetadata).toBeUndefined();
    });
  });

  describe('Method with roles', () => {
    const methodRoles = [UserRoles.UserManager, UserRoles.Admin];

    // tslint:disable-next-line: max-classes-per-file
    class ClassWithoutRoles {
      @Roles(...methodRoles)
      // tslint:disable-next-line: no-empty
      methodWithRoles() {}
    }

    it('should set method metadata', () => {
      const instance = new ClassWithoutRoles();

      const classMetadata = Reflect.getMetadata(NEEDED_ROLE_METADATA, ClassWithoutRoles);
      const methodMetadata = Reflect.getMetadata(NEEDED_ROLE_METADATA, instance.methodWithRoles);
      const instanceMetadata = Reflect.getMetadata(NEEDED_ROLE_METADATA, instance);

      expect(classMetadata).toBeUndefined();
      expect(methodMetadata).toStrictEqual(methodRoles);
      expect(instanceMetadata).toBeUndefined();
    });
  });
});

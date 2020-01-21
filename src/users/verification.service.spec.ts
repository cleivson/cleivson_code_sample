import { BadRequestException } from '@nestjs/common';
import { anyFunction, anyString, anything, capture, instance, mock, spy, verify, when } from 'ts-mockito';
import { EntityManager, Repository } from 'typeorm';
import { MailTemplateService } from './mail-template';
import { User, VerificationToken } from './model';
import { VerificationService } from './verification.service';
import moment = require('moment');

describe('VerificationService', () => {
  let service: VerificationService;
  let repositoryMock: Repository<VerificationToken>;
  let usersRepositoryMock: Repository<User>;
  let mailTemplateServiceMock: MailTemplateService;
  let entityManagerMock: EntityManager;
  let momentSpy: moment.Moment;

  beforeEach(() => {
    repositoryMock = mock<Repository<VerificationToken>>(Repository);
    usersRepositoryMock = mock<Repository<User>>(Repository);
    mailTemplateServiceMock = mock<MailTemplateService>(MailTemplateService);
    entityManagerMock = mock<EntityManager>(EntityManager);

    service = new VerificationService(instance(repositoryMock), instance(mailTemplateServiceMock));

    when(repositoryMock.manager).thenReturn(instance(entityManagerMock));
    when(entityManagerMock.getRepository(User)).thenReturn(instance(usersRepositoryMock));
    when(entityManagerMock.getRepository(VerificationToken)).thenReturn(instance(repositoryMock));

    momentSpy = spy(moment.utc());
    const momentNamespaceSpy: typeof moment = spy(moment);
    when(momentNamespaceSpy.utc()).thenReturn(instance(momentSpy));
  });

  describe('generateValidationToken()', () => {
    const userEmail = 'test@test.com';
    const token = 'token';
    const user: User = { email: userEmail };
    const expirationMoment = moment('2020-10-02');

    const expectedVerificationToken: VerificationToken = { expirationDate: expirationMoment.toDate(), user };

    beforeEach(() => {
      when(repositoryMock.save(anything())).thenResolve({ ...expectedVerificationToken, token });
    });

    it('should save verification token with 1d expiration', async () => {

      when(momentSpy.add(1, 'day')).thenReturn(expirationMoment);
      when(entityManagerMock.transaction(anyFunction())).thenCall(async func => func(instance(entityManagerMock)));

      const resultVerificationToken = await service.generateValidationToken(user);

      const [savedVerificationToken] = capture(repositoryMock.save).last();
      expect(savedVerificationToken).toEqual(expectedVerificationToken);
      expect(resultVerificationToken.token).toBe(token);
    });

    it('should update user to unverified inside transaction', async () => {
      await service.generateValidationToken(user);

      verify(usersRepositoryMock.save(anything())).never();

      // We need to call the transaction function to trigger the actions whithin the transaction
      const [transactionFunction] = capture(entityManagerMock.transaction).last();
      await (transactionFunction as any)(instance(entityManagerMock));

      verify(usersRepositoryMock.save(anything())).once();

      const [savedUser] = capture(usersRepositoryMock.save).last();
      expect(savedUser.verified).toBeFalsy();
    });

    it('should send verification email inside transaction', async () => {
      await service.generateValidationToken(user);

      verify(mailTemplateServiceMock.sendAccountValidationMail(userEmail, token)).never();

      // We need to call the transaction function to trigger the actions whithin the transaction
      const [transactionFunction] = capture(entityManagerMock.transaction).last();
      await (transactionFunction as any)(instance(entityManagerMock));

      verify(mailTemplateServiceMock.sendAccountValidationMail(userEmail, token)).once();
    });

    it('should throw BadRequestException if failed to send email', async () => {
      // Automatically calls the transaction function
      when(entityManagerMock.transaction(anyFunction())).thenCall(async func => func(instance(entityManagerMock)));
      when(mailTemplateServiceMock.sendAccountValidationMail(anyString(), anyString())).thenThrow(new BadRequestException('invalid email'));

      expect(service.generateValidationToken(user)).rejects.toThrow(BadRequestException);
    });
  });
});

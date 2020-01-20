import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailTemplateService } from 'users/mail-template';
import { EntityManager, Repository } from 'typeorm';
import { UserAlreadyVerifiedException, VerificationTokenExpiredException, VerificationTokenNotFoundException } from './exceptions';
import { User, VerificationToken } from './model';
import moment = require('moment');

/**
 * Services related to the verification token of a user just created.
 */
@Injectable()
export class VerificationService {
  constructor(@InjectRepository(VerificationToken) private readonly verificationTokenRepository: Repository<VerificationToken>,
              private readonly mailService: MailTemplateService) { }

  /**
   * Creates a new verification token for the user.
   * @param user The user with a pending verification
   */
  async generateValidationToken(user: User): Promise<VerificationToken> {
    const expirationDate: moment.Moment = this.getExpirationDate();

    const verificationToken: VerificationToken = new VerificationToken(user, expirationDate.toDate());

    let savedVerificationToken: VerificationToken;
    await this.verificationTokenRepository.manager.transaction(async transactionManager => {
      savedVerificationToken = await this.verificationTokenRepository.save(verificationToken);

      this.markUserAsUnverified(user, transactionManager);
    });

    await this.mailService.sendAccountValidationMail(savedVerificationToken.token, user.email);

    return savedVerificationToken;
  }

  /**
   * Checks if a verification token is valid based on its key.
   * @param token The token key to find the verification token.
   * @param userEmail The email of the user being validated.
   * @returns The user associated to the token.
   * @throws NotFoundException when the token was not found related to the user.
   * @throws VerificationTokenExpiredException when the token already expired.
   * @throws UserAlreadyVerifiedException when the user associated to the token was already verified.
   */
  async validateToken(token: string, userEmail: string): Promise<User> {
    const verificationToken = await this.getVerificationToken(token, userEmail);

    this.checkTokenIsValid(verificationToken);

    await this.markUserAsVerified(verificationToken);

    await this.verificationTokenRepository.remove(verificationToken);

    return verificationToken.user;
  }

  private async getVerificationToken(token: string, userEmail: string) {
    return this.verificationTokenRepository.createQueryBuilder('verificationToken')
      .innerJoinAndSelect('verificationToken.user', 'user')
      .where('token = :token and user.email like :userEmail', { userEmail, token }) // Workaround due to https://github.com/typeorm/typeorm/issues/4429
      .getOne();
  }

  private checkTokenIsValid(verificationToken: VerificationToken) {
    if (!verificationToken) {
      throw new VerificationTokenNotFoundException();
    }

    this.validateTokenExpiration(verificationToken);

    if (verificationToken.user.verified) {
      throw new UserAlreadyVerifiedException();
    }
  }

  private getExpirationDate(): moment.Moment {
    return moment.utc().add(1, 'day');
  }

  private validateTokenExpiration(verificationToken: VerificationToken) {
    const now = moment.utc();
    const expired = now.isAfter(moment.utc(verificationToken.expirationDate));

    if (expired) {
      throw new VerificationTokenExpiredException();
    }
  }

  private async markUserAsVerified(verificationToken: VerificationToken): Promise<User> {
    const usersRepository = this.verificationTokenRepository.manager.getRepository(User);

    const user = verificationToken.user;
    user.verified = true;

    return usersRepository.save(user);
  }

  private async markUserAsUnverified(user: User, transactionManager: EntityManager): Promise<User> {
    const usersRepository = transactionManager.getRepository(User);

    user.verified = true;

    return usersRepository.save(user);
  }
}

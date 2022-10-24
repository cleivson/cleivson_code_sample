import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CrudRequest } from '@nestjsx/crud';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from 'users';
import { DuplicateUserException } from 'users/exceptions';
import { MailTemplateService } from 'users/mail-template';
import { UsersService } from 'users/users.service';
import { AcceptInviteRequest } from './dto';
import { ExpiredTokenException, InvalidTokenException } from './exceptions';
import { InviteToken } from './invite-token';

@Injectable()
export class InviteService {
  constructor(private readonly usersService: UsersService,
              private readonly jwtService: JwtService,
              private readonly mailService: MailTemplateService) { }

  /**
   * Invites a new user based on his/her email.
   * @param email The email of the user to be invited.
   * @throws DuplicateUserException if there is already an user with the desired email.
   */
  async invite(email: string) {
    await this.validateExistingUser(email);

    const inviteToken: InviteToken = { email };

    const token = await this.jwtService.signAsync(inviteToken);

    await this.mailService.sendInvitationMail(email, token);
  }

  /**
   * Checks if a invite token is still valid to create a new user.
   * @param token The invite token to be validate.
   * @throws ExpiredTokenException if the token is expired.
   * @throws InvalidTokenException if it was not possible to parse the token.
   * @throws UnauthorizedException if there was any unknown problem with the format of the token.
   * @throws DuplicateUserException if the token is associated to an email of a registered user.
   */
  async validateInviteToken(token: string): Promise<InviteToken> {
    const inviteToken: InviteToken = await this.verifyToken(token);

    await this.validateExistingUser(inviteToken.email);

    return inviteToken;
  }

  /**
   * Accepts an invite request by providing the invite token and the complimentary needed information to create an user.
   * @param acceptRequest The request to accept an registry invitation.
   * @param req The http crud request.
   * @throws ExpiredTokenException if the token is expired.
   * @throws InvalidTokenException if it was not possible to parse the token.
   * @throws UnauthorizedException if there was any unknown problem with the format of the token.
   * @throws DuplicateUserException if the token is associated to an email of a registered user.
   * @throws BadRequestException if the id and/or the passwordHash properties of the user are set.
   */
  async acceptInvite(acceptRequest: AcceptInviteRequest, req: CrudRequest) {
    const inviteToken = await this.validateInviteToken(acceptRequest.token);

    const newUser: User = this.createUserToInsert(inviteToken, acceptRequest);

    return this.usersService.createOne(req, newUser);
  }

  private async verifyToken(token: string): Promise<InviteToken> {
    let tokenPayload: InviteToken;

    try {
      tokenPayload = await this.jwtService.verifyAsync(token);
    } catch (e) {
      if (e.name === TokenExpiredError.name) {
        throw new ExpiredTokenException();
      } else if (e.name === JsonWebTokenError.name) {
        throw new InvalidTokenException();
      } else {
        throw new UnauthorizedException();
      }
    }

    if (!tokenPayload.email) {
      throw new InvalidTokenException();
    }

    return tokenPayload;
  }

  private async validateExistingUser(email: string) {
    const existingUser = await this.usersService.findOne({ where: { email }, select: ['id'] });
    if (existingUser) {
      throw new DuplicateUserException(email);
    }
  }

  private createUserToInsert(inviteToken: InviteToken, acceptRequest: AcceptInviteRequest): User {
    return {
      email: inviteToken.email,
      firstName: acceptRequest.firstName,
      lastName: acceptRequest.lastName,
      password: acceptRequest.password,
      verified: true,
    };
  }
}

import { SuperTest, Test } from 'supertest';
import { CreateUserRequestDto } from 'users';

/**
 * Authenticates a user and returns its access token.
 * @param request - The supertest request bound to the main app.
 * @param credentials - The credentials to authenticate and get access token.
 */
export const getAccessToken = async (request: SuperTest<Test>, credentials: CreateUserRequestDto): Promise<string> => {
  const response = await request.post('/auth/login').auth(credentials.username, credentials.password, { type: 'basic' });
  return response.body.access_token;
};

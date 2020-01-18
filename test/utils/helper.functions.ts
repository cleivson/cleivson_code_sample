import { SuperTest, Test } from 'supertest';
import { User } from 'users';

/**
 * Authenticates a user and returns its access token.
 * @param request - The supertest request bound to the main app.
 * @param credentials - The credentials to authenticate and get access token.
 */
export const getAccessToken = async (request: SuperTest<Test>, credentials: Partial<User>): Promise<string> => {
  const response = await request.post('/account/login').auth(credentials.email, credentials.password, { type: 'basic' });
  return response.body.access_token;
};

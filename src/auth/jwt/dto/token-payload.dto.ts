
/**
 * Represents the payload to be serialized into the Bearer token issued to a logged user.
 */
export interface TokenPayload {
  /**
   * The name of the logger user.
   */
  username: string;

  /**
   * Id of the logged user.
   */
  sub: number;
}

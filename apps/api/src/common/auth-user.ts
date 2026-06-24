/** The authenticated principal attached to the request by JwtStrategy. */
export interface AuthUser {
  userId: string;
  email: string;
}

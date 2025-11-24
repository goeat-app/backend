export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PayloadRefreshToken {
  sub: string;
  username: string;
}

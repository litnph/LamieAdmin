export enum UserRole {
  Admin = 1,
  Manager = 2,
  Staff = 3,
}

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: AuthTokens;
};

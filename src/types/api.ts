export type UserRole = 'ISSUER' | 'HOLDER';

export type CredentialStatus = 'PENDING' | 'VERIFIED' | 'INVALID';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress: string | null;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  accessToken: string;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  accessToken: string;
}

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
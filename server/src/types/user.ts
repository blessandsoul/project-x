export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  password?: string;
}

export interface UserLogin {
  identifier: string; // Can be either email or username
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

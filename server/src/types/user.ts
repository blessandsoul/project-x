export type UserRole = 'user' | 'dealer' | 'company' | 'admin';

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  dealer_slug: string | null;
  company_id: number | null;
  onboarding_ends_at: Date | null;
  is_blocked: boolean;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  company_logo_url?: string | null;
  original_company_logo_url?: string | null;
  avatar_url?: string | null;
  original_avatar_url?: string | null;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  role?: UserRole; // defaults to 'user' at the database/model level
  dealer_slug?: string | null;
  company_id?: number | null;
  onboarding_ends_at?: Date | null;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  dealer_slug?: string | null;
  company_id?: number | null;
  onboarding_ends_at?: Date | null;
  is_blocked?: boolean;
}

export interface UserLogin {
  identifier: string; // Can be either email or username
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role?: UserRole; // optional for backward compatibility
  company_id?: number | null;
  company_logo_url?: string | null;
  original_company_logo_url?: string | null;
  avatar_url?: string | null;
  original_avatar_url?: string | null;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role?: UserRole;
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

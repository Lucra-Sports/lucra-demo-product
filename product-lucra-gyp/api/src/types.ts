import { User as PrismaUser, Number as PrismaNumber, UserBinding as PrismaUserBinding } from '@prisma/client';

// Re-export Prisma types for convenience
export type { User as PrismaUser, Number as PrismaNumber, UserBinding as PrismaUserBinding } from '@prisma/client';

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthday?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthday?: string;
}

export interface CreateBindingRequest {
  externalId: string;
  type: string;
}

// API Response types (excluding sensitive data)
export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  birthday?: string | null;
}

export interface NumberResponse {
  id: number;
  value: number;
  createdAt: Date;
}

export interface UserBindingResponse {
  id: number;
  userId: number;
  externalId: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RngResponse {
  number: number;
  created_at: Date;
}

export interface StatsResponse {
  totalNumbersGenerated: number;
  bestNumber: number;
}

export interface NumbersListResponse {
  numbers: NumberResponse[];
  page: number;
  totalPages: number;
  next: string | null;
}

export interface ErrorResponse {
  error: string;
}

export interface SignupResponse {
  id: number;
}

export interface BindingCreatedResponse {
  id: number;
  userId: number;
  externalId: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export type CreateUserData = Omit<PrismaUser, 'id'>;
export type UpdateUserData = Partial<Omit<PrismaUser, 'id' | 'email'>>;
export type CreateBindingData = Omit<PrismaUserBinding, 'id' | 'createdAt' | 'updatedAt'>;

// Database query result types
export interface UserWithNumbers extends PrismaUser {
  numbers: PrismaNumber[];
}

export interface UserWithBindings extends PrismaUser {
  bindings: PrismaUserBinding[];
}

export interface NumbersWithPagination {
  numbers: NumberResponse[];
  total: number;
  totalPages: number;
}

// Authentication types
export interface AuthenticatedUser {
  id: number;
  fullName: string;
  email: string;
}

// Request extension for authenticated routes
export interface AuthenticatedRequest {
  userId?: string;
}

// Common binding types
export enum BindingType {
  EXTERNAL_API = 'external_api',
  THIRD_PARTY_SERVICE = 'third_party_service',
  OAUTH_PROVIDER = 'oauth_provider',
  PAYMENT_PROVIDER = 'payment_provider',
}

// API Request and Response Types matching backend

export type UserRole = 'student' | 'faculty' | 'ta';

// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  username: string; // Will be sent as "name" to backend
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: number;
    name: string; // Backend uses "name" instead of "username"
    email: string;
    role: UserRole;
  };
  token: string;
  message?: string;
}

// User API Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

// Error Response Type
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

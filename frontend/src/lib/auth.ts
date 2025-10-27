// Authentication API calls

import { post } from './api';
import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  PasswordResetResponse,
} from '../types/api';

// Authentication endpoints matching backend routes
const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
};

/**
 * Login user
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
  
  // Store token and user data in localStorage
  if (response.token && response.user) { // Added check for response.user
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
  }
  
  return response;
}

/**
 * Register new user
 */
export async function signUp(userData: SignUpRequest): Promise<AuthResponse> {
  // Transform data to match backend format
  const requestData = {
    name: userData.username,
    email: userData.email,
    password: userData.password,
    role: userData.role,
  };
  
  const response = await post<AuthResponse>(AUTH_ENDPOINTS.REGISTER, requestData);
  
  // Store token and user data in localStorage
  if (response.token && response.user) { // Added check for response.user
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
  }
  
  return response;
}

/**
 * Logout user (client-side only)
 */
export async function logout(): Promise<void> {
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// ========================================================
// ✅ --- THIS FUNCTION IS NOW FIXED ---
// ========================================================
/**
 * Get stored user data
 */
export function getCurrentUser(): AuthResponse['user'] | null {
  const userData = localStorage.getItem('currentUser');

  // Check for null OR the literal string "undefined"
  if (!userData || userData === "undefined") {
    return null;
  }

  // Add a try...catch block as a safeguard
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error("Failed to parse user data from localStorage:", error);
    return null; // Fail gracefully
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getCurrentUser();
}
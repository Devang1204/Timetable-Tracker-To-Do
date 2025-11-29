// API Configuration and Base Fetch Wrapper

// Backend API URL
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Base fetch wrapper with error handling and token management
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authorization token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
const config: RequestInit = {
    ...fetchOptions,
    headers,
    body: options.body // Include the original body here initially
  };

  // --- FIX FOR FILE UPLOAD ---
  // If the body is FormData, delete the Content-Type header
  // so the browser can set it correctly.
  if (config.body instanceof FormData) {
      delete (config.headers as Record<string, string>)['Content-Type'];
  } 
  // --- END FIX ---
  // (Keep the JSON.stringify for non-FormData bodies if needed)
  else if (config.body && typeof config.body !== 'string') {
     // If it's not FormData and not already a string, stringify it
     // Ensure body exists before trying to stringify
     config.body = JSON.stringify(config.body); 
  }


  try {
    // Fetch call now uses the corrected config
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config); 
    // ... rest of the function
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      // Handle Authentication Errors
      if (response.status === 401 || response.status === 403) {
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Dispatch event to notify App.tsx to logout
        window.dispatchEvent(new Event('auth:logout'));
      }

      const errorData = isJson ? await response.json() : { message: response.statusText };
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // Return parsed JSON or null for empty responses
    if (isJson) {
      return await response.json();
    }
    
    return null as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * GET request
 */
export function get<T>(endpoint: string, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET', token });
}

/**
 * POST request
 */
export function post<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    token,
  });
}

/**
 * PUT request
 */
export function put<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    token,
  });
}

/**
 * PATCH request
 */
export function patch<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    token,
  });
}

/**
 * DELETE request
 */
export function del<T>(endpoint: string, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE', token });
}

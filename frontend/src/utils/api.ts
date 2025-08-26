// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  console.log('🔗 API Call:', `${API_BASE_URL}${endpoint}`)
  console.log('🍪 Credentials:', options.credentials || 'include')
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include', // This is crucial for cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  console.log('📡 Response status:', response.status)
  console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText)
    throw new ApiError(response.status, errorText);
  }

  return response.json();
}

export const authApi = {
  getCurrentUser: () => apiCall('/auth/me'),
  getProfile: () => apiCall('/auth/profile'),
  signOut: () => apiCall('/auth/signout', { method: 'POST' }),
};

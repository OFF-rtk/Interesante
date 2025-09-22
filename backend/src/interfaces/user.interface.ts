export interface AuthUser {
    id: string;
    userId: string;
    sub: string;
    email: string;
    role?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      [key: string]: any;
    };
    exp?: number;
    iat?: number;
    aud?: string;
  }
  
  export interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    user_metadata?: Record<string, any>;
    exp?: number;
    iat?: number;
    aud?: string;
    [key: string]: any;
  }
  
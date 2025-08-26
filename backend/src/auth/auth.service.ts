// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class SignInDto {
  @IsString()
  supabaseToken: string;
}

@Injectable()
export class AuthService {
  private supabaseClient: SupabaseClient;
  private jwks: jwksClient.JwksClient;
  private projectRef: string;

  constructor(private readonly config: ConfigService) {
    
    const supabaseUrl = this.config.get<string>('SUPABASE_URL')!;
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_KEY')!;

    this.supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    this.projectRef = this.config.get<string>('SUPABASE_PROJECT_REF')!;
    const jwksUri = `https://${this.projectRef}.supabase.co/auth/v1/keys`;

    this.jwks = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  // getSigningKey used by jsonwebtoken verify
  private getSigningKey = (header: any, callback: any) => {
    this.jwks.getSigningKey(header.kid, (err, key: any) => {
      if (err) return callback(err);
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  };

  /**
   * Verify the Supabase-issued JWT using JWKS.
   * Returns minimal user info (userId/email) and raw payload.
   */
  async verifySupabaseToken(accessToken: string): Promise<{
    userId: string;
    email?: string;
    raw: any;
  }> {
    return new Promise((resolve, reject) => {

      const decoded = jwt.decode(accessToken, { complete: true }) as any;

      if (!decoded || !decoded.header) {
        return reject(new UnauthorizedException('Invalid token format'))
      }

      const alg = String(decoded.header.alg ?? '').toUpperCase();

      if (alg.startsWith('HS')) {
        const secret = this.config.get<string>('SUPABASE_JWT_SECRET');
        if (!secret) {
          return reject(new UnauthorizedException('Server missing SUPABASE_JWT_SECRET'));
        }

        jwt.verify(
          accessToken,
          secret,
          {
            algorithms: ['HS256'],
            // Optional strict checks:
            // issuer: `https://${this.projectRef}.supabase.co/auth/v1`,
            // audience: 'authenticated',
          },
          (err, payload) => {
            if (err) {
              return reject(new UnauthorizedException('Invalid or Expired Supabase token'));
            }
            const decoded = payload as any;
            resolve({
              userId: decoded.sub,
              email: decoded.email,
              raw: decoded,
            })
          }
        )
        return;
      }

      if (alg.startsWith('RS')) {
        jwt.verify(
          accessToken,
          this.getSigningKey.bind(this),
          {
            algorithms: ['RS256'],
            // optional strict checks:
            // issuer: `https://${this.projectRef}.supabase.co/auth/v1`,
            // audience: 'authenticated',
          },
          (err, decoded) => {
            if (err) {
              return reject(new UnauthorizedException('Invalid or expired Supabase token'));
            }
            const payload = decoded as any;
            resolve({
              userId: payload.sub,
              email: payload.email,
              raw: payload,
            });
          },
        );
        return;
      }

      reject(new UnauthorizedException('Unsupported token algorithm'));
    });
  }

  async signUp(dto: SignUpDto) {
    const { error } = await this.supabaseClient.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: { data: { username: dto.username } },
    });
    if (error) throw new BadRequestException(error.message);
    return { message: 'Sign up successful! Please check your email to confirm.' };
  }

  /**
   * Sign-in for email/password flows where frontend gets a Supabase token,
   * and then posts it here for verification. We just verify & return token back.
   */
  async signIn(dto: SignInDto): Promise<{ supabaseToken: string }> {
    await this.verifySupabaseToken(dto.supabaseToken);
    return { supabaseToken: dto.supabaseToken };
  }
}

// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const cookieExtractor = (req: any): string | null => {
  console.log('🍪 Cookie extractor called');
  console.log('🍪 Request cookies:', req?.cookies);
  const token = req?.cookies?.access_token ?? null;
  console.log('🔑 Extracted token:', token ? 'Found' : 'Not found');
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private jwks?: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        req: any,
        rawJwt: string | undefined,
        done: (err: any, secret?: string | Buffer) => void,
      ) => {
        (async () => {
          try {
            console.log('🔍 secretOrKeyProvider called');
            console.log('🔑 Raw JWT provided:', rawJwt ? 'Yes' : 'No');
            
            if (!rawJwt) {
              console.log('❌ No token provided');
              return done(new UnauthorizedException('No token provided'), undefined);
            }

            const decoded = jwt.decode(rawJwt, { complete: true }) as
              | { header?: Record<string, any> }
              | null;

            if (!decoded || !decoded.header) {
              console.log('❌ Invalid token format');
              return done(new UnauthorizedException('Invalid token format'), undefined);
            }

            const alg = String(decoded.header.alg ?? '').toUpperCase();
            console.log('🔐 Token algorithm:', alg);

            // HS256 - use symmetric secret
            if (alg.startsWith('HS')) {
              console.log('🔐 Using HS256 with secret');
              const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
              if (!secret) {
                console.log('❌ Missing SUPABASE_JWT_SECRET');
                return done(new UnauthorizedException('Server missing SUPABASE_JWT_SECRET'), undefined);
              }
              console.log('✅ Secret found, length:', secret.length);
              return done(null, secret);
            }

            // RS256 - use JWKS (kid -> public key)
            if (alg.startsWith('RS')) {
              console.log('🔐 Using RS256 with JWKS');
              const projectRef = this.configService.get<string>('SUPABASE_PROJECT_REF');
              if (!projectRef) {
                console.log('❌ Missing SUPABASE_PROJECT_REF');
                return done(new UnauthorizedException('Missing SUPABASE_PROJECT_REF'), undefined);
              }

              if (!this.jwks) {
                const jwksUri = `https://${projectRef}.supabase.co/auth/v1/keys`;
                console.log('🔗 Creating JWKS client for:', jwksUri);
                this.jwks = jwksClient({ jwksUri, cache: true, rateLimit: true });
              }

              const kid = decoded.header.kid;
              if (!kid) {
                console.log('❌ Token missing kid header');
                return done(new UnauthorizedException('Token missing kid header'), undefined);
              }

              console.log('🔑 Getting signing key for kid:', kid);
              this.jwks.getSigningKey(kid, (err, key: any) => {
                if (err) {
                  console.log('❌ JWKS error:', err);
                  return done(err, undefined);
                }
                try {
                  const pub = key.getPublicKey();
                  console.log('✅ Public key retrieved');
                  return done(null, pub);
                } catch (e) {
                  console.log('❌ Error getting public key:', e);
                  return done(e, undefined);
                }
              });

              return;
            }

            console.log('❌ Unsupported algorithm:', alg);
            return done(new UnauthorizedException('Unsupported token algorithm'), undefined);
          } catch (err) {
            console.log('❌ secretOrKeyProvider error:', err);
            return done(err, undefined);
          }
        })();
      },
      algorithms: ['RS256', 'HS256'],
    });
  }

  async validate(payload: any) {
    console.log('✅ JWT validate called with payload:', {
      sub: payload?.sub,
      email: payload?.email,
      exp: payload?.exp
    });
    
    if (!payload?.sub) {
      console.log('❌ No sub in payload');
      throw new UnauthorizedException();
    }
    
    console.log('✅ Validation successful');
    return {
      id: payload.sub, // Changed from userId to id to match your controller
      userId: payload.sub, // Keep both for compatibility
      email: payload.email,
      role: payload.role || 'authenticated',
      user_metadata: payload.user_metadata, // Include metadata for avatar/name
      ...payload, // Include full payload
    };
  }
}

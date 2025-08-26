// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService, SignInDto, SignUpDto } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '../decorators/user.decorator';
import type { Response } from 'express';

// Define interface for request with cookies
interface RequestWithCookies {
  cookies?: { [key: string]: string };
  [key: string]: any;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { supabaseToken } = await this.authService.signIn(signInDto);

    response.cookie('access_token', supabaseToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Successfully signed in' };
  }

  @Get('debug-cookies')
  debugCookies(@Req() req: RequestWithCookies) {
    const cookies = req.cookies;
    console.log('🧪 All cookies received:', cookies);
    console.log('🧪 Access token cookie:', cookies?.access_token);
    
    return {
      hasCookies: !!cookies,
      cookieCount: Object.keys(cookies || {}).length,
      hasAccessToken: !!cookies?.access_token,
      cookies: cookies,
    };
  }

  @Get('debug-token')
  debugToken(@Req() req: RequestWithCookies) {
    const token = req.cookies?.access_token;
    if (!token) return { error: 'No token found' };
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token, { complete: true });
      return {
        header: decoded?.header,
        payload: {
          sub: decoded?.payload?.sub,
          email: decoded?.payload?.email,
          exp: decoded?.payload?.exp,
          alg: decoded?.header?.alg,
        }
      };
    } catch (error) {
      return { error: 'Failed to decode token', details: error.message };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getCurrentUser(@User() user: any) {
    console.log('🔍 Getting user data for user:', user);
    
    return {
      id: user.id || user.userId,
      name: user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 'User',
      email: user.email,
      avatar: user.user_metadata?.avatar_url || 
              user.user_metadata?.picture || '',
      role: user.role || 'authenticated',
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@User() user: any) {
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('verify')
  verify(@User() user: any) {
    return { authenticated: true, user };
  }

  @Post('signout')
  async signOut(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', { 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Successfully signed out' };
  }
}

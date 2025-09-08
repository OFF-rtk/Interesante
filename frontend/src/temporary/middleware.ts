// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export async function middleware(request: NextRequest) {
  console.log('🚀 Middleware running for:', request.nextUrl.pathname)
  
  const accessToken = request.cookies.get('access_token')?.value
  console.log('🍪 Cookie exists:', !!accessToken)
  console.log('🍪 Cookie preview:', accessToken?.substring(0, 50) + '...')

  const isAuthenticated = await isValidToken(accessToken)
  console.log('🔐 Is authenticated:', isAuthenticated)

  // If user is not authenticated and tries to access protected routes
  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('❌ Redirecting to /auth (not authenticated)')
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // If user is authenticated and tries to access auth page
  if (isAuthenticated && request.nextUrl.pathname === '/auth') {
    console.log('✅ Redirecting to /dashboard (already authenticated)')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If user is authenticated and tries to access root page
  if (isAuthenticated && request.nextUrl.pathname === '/') {
    console.log('✅ Redirecting to /dashboard (from root)')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('➡️ Allowing request to continue')
  return NextResponse.next()
}

// Helper function to validate the token
async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    console.log('❌ No token provided')
    return false
  }

  try {
    console.log('🔍 Decoding token...')
    const decoded = jwt.decode(token) as any
    console.log('📝 Decoded token:', {
      sub: decoded?.sub,
      email: decoded?.email,
      exp: decoded?.exp,
      iat: decoded?.iat
    })
    
    if (!decoded || !decoded.exp) {
      console.log('❌ Token missing or no expiry')
      return false
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = decoded.exp - now
    console.log('⏰ Token expires in:', timeUntilExpiry, 'seconds')
    
    if (decoded.exp < now) {
      console.log('❌ Token is expired')
      return false
    }
    
    console.log('✅ Token is valid')
    return true
    
  } catch (error) {
    console.log('❌ Token decode error:', error)
    return false
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth'],
}

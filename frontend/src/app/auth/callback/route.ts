// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Call your backend to set the HTTP-only cookie
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      try {
        const backendResponse = await fetch(`${apiUrl}/auth/signin`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ supabaseToken: data.session.access_token }),
        })

        if (backendResponse.ok) {
          // Create the redirect response
          const response = NextResponse.redirect(`${origin}${next}`)
          
          // Forward the Set-Cookie header from your backend
          const setCookieHeader = backendResponse.headers.get('set-cookie')
          if (setCookieHeader) {
            response.headers.set('set-cookie', setCookieHeader)
          }
          
          return response
        }
      } catch (error) {
        console.error('Backend signin error:', error)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

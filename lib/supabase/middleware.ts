import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach((c) =>
                        response.cookies.set(c.name, c.value, c.options)
                    )
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    let user = session?.user || null
    if (session) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) user = authUser
    }


    // Protected routes logic
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Auth routes logic (don't let logged-in users see login)
    if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

// Rutas publicas: accesibles sin iniciar sesion.
// El corazon del MVP (ver necesidades) es publico: cualquier donante o
// voluntario del mundo puede consultarlas sin registrarse. El registro
// solo se exige para CREAR una necesidad o acciones que requieran identidad.
const publicRoutes = [
  '/',
  '/sign-in',
  '/registro',
  '/necesidades',        // listado y detalle de necesidades (lectura)
  '/ofrecimientos',      // listado y detalle de ofrecimientos (lectura)
  '/organizaciones',     // listado y detalle de organizaciones (lectura)
  '/colaborar',          // landing para quien quiere sumarse al proyecto
  '/api/auth',
  '/verificar',          // consumir el enlace de verificacion de correo
  '/asistente',          // chat del asistente IA (Fase 2). No enlazado desde
  '/api/asistente',      // ningun lugar visible; publico porque el asistente
                          // atiende a cualquiera, damnificado o no, sin cuenta.
]

// Determina si una ruta es publica (coincidencia exacta o subruta).
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const pathname = nextUrl.pathname

  const publica = isPublicRoute(pathname)

  // No logueado intentando entrar a ruta protegida -> a sign-in.
  if (!publica && !isLoggedIn) {
    const url = new URL('/sign-in', nextUrl)
    // Guardar destino para redirigir de vuelta tras el login.
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Logueado que va a sign-in o registro -> ya no tiene sentido, al inicio.
  if (isLoggedIn && (pathname === '/sign-in' || pathname === '/registro')) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  return NextResponse.next()
})

// El matcher excluye archivos estaticos y assets; corre en el resto.
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

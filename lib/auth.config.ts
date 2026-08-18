import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Config minima Edge-compatible para el middleware (sin Prisma/adapter).
// La logica completa de login vive en auth.ts (entorno Node).
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contrasena', type: 'password' },
      },
      // El authorize real esta en auth.ts; aqui es un stub para el edge.
      authorize: async () => null,
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.rol = token.rol as string
        session.user.municipioCodigo = (token.municipioCodigo as string | null) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
}

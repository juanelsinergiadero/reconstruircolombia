import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contrasena', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          rol: user.rol,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // En login (user presente) o cuando se llama update() desde el cliente.
      if (user || trigger === 'update') {
        const userId = (user?.id as string | undefined) ?? (token.id as string)
        if (userId) {
          const fullUser = await prisma.user.findUnique({
            where: { id: userId },
          })
          if (fullUser) {
            token.id = fullUser.id
            token.rol = fullUser.rol
            token.municipioCodigo = fullUser.municipioCodigo
          }
        }
      }
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
})

// Helper para obtener el usuario de la sesion actual (Server Components / actions).
export async function getAuthUser() {
  const session = await auth()
  return session?.user ?? null
}

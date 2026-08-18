import type { DefaultSession } from 'next-auth'

// Augmentacion de tipos: declara los campos custom que reconstruircolombia
// agrega a la sesion y al JWT (rol del dominio y municipio de referencia).
// Sin esto, TypeScript no reconoce session.user.rol ni token.municipioCodigo.

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: string
      municipioCodigo: string | null
    } & DefaultSession['user']
  }

  // El objeto devuelto por authorize() en auth.ts.
  interface User {
    rol?: string
    municipioCodigo?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    rol?: string
    municipioCodigo?: string | null
  }
}

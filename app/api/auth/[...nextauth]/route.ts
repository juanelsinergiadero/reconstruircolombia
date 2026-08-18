// Route handler de NextAuth v5. Expone GET y POST para todos los
// endpoints de autenticacion (/api/auth/*). Los handlers vienen de auth.ts.
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers

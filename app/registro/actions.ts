'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registroSchema } from '@/lib/validations/auth'
import { rutaCallbackSegura } from '@/lib/url'

export type RegistroState = {
  ok: boolean
  errores?: Record<string, string[]>
  mensaje?: string
}

export async function registrarUsuario(
  _prev: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  const parsed = registroSchema.safeParse({
    nombre: formData.get('nombre'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmarPassword: formData.get('confirmarPassword'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.flatten().fieldErrors,
      mensaje: 'Revisa los campos marcados.',
    }
  }

  const { nombre, email, password } = parsed.data

  const existente = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existente) {
    return {
      ok: false,
      errores: { email: ['Ya existe una cuenta con este correo.'] },
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    await prisma.user.create({
      data: {
        email,
        nombre,
        password: passwordHash,
        rol: 'DAMNIFICADO',
      },
    })
  } catch {
    return {
      ok: false,
      mensaje: 'No se pudo crear la cuenta. Intenta de nuevo.',
    }
  }

  const callbackUrl = rutaCallbackSegura(formData.get('callbackUrl') as string | null)

  try {
    // Cuenta creada: inicia sesion de inmediato para no pedirle a la
    // persona damnificada un segundo paso. signIn() redirige en exito.
    await signIn('credentials', { email, password, redirectTo: callbackUrl })
  } catch (error) {
    if (error instanceof AuthError) {
      // Cuenta creada pero el login automatico fallo por alguna razon:
      // que inicie sesion manualmente en vez de dejarla en un limbo.
      return {
        ok: true,
        mensaje: 'Cuenta creada. Inicia sesion para continuar.',
      }
    }
    throw error
  }

  return { ok: true }
}

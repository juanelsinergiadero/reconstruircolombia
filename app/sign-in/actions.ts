'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'
import { rutaCallbackSegura } from '@/lib/url'

export type IniciarSesionState = {
  ok: boolean
  errores?: Record<string, string[]>
  mensaje?: string
}

export async function iniciarSesion(
  _prev: IniciarSesionState,
  formData: FormData
): Promise<IniciarSesionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.flatten().fieldErrors,
      mensaje: 'Revisa los campos marcados.',
    }
  }

  const callbackUrl = rutaCallbackSegura(formData.get('callbackUrl') as string | null)

  try {
    // signIn() redirige internamente en exito (lanza NEXT_REDIRECT), por
    // eso no hay "return { ok: true }" despues de una llamada exitosa.
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, mensaje: 'Correo o contrasena incorrectos.' }
    }
    // NEXT_REDIRECT y otros errores de framework deben propagarse.
    throw error
  }

  return { ok: true }
}

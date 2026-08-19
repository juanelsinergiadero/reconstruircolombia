'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { crearYEnviarVerificacion } from '@/lib/verificacion'

export type ReenviarVerificacionState = {
  ok: boolean
  mensaje?: string
}

export async function reenviarVerificacion(
  _prev: ReenviarVerificacionState,
  _formData: FormData
): Promise<ReenviarVerificacionState> {
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion.' }
  }

  const registro = await prisma.user.findUnique({
    where: { id: usuario.id },
    select: { email: true, nombre: true, emailVerificado: true },
  })
  if (!registro) {
    return { ok: false, mensaje: 'No se encontro tu cuenta.' }
  }

  if (registro.emailVerificado) {
    return { ok: true, mensaje: 'Tu correo ya esta verificado.' }
  }

  // No bloquea: si el envio falla, la persona puede seguir usando la
  // plataforma igual y reintentar el reenvio despues.
  try {
    await crearYEnviarVerificacion(usuario.id, registro.email, registro.nombre)
  } catch (error) {
    console.error('[perfil] No se pudo reenviar el correo de verificacion:', error)
    return { ok: false, mensaje: 'No se pudo enviar el correo. Intenta de nuevo.' }
  }

  return { ok: true, mensaje: 'Te enviamos un nuevo correo de verificacion.' }
}

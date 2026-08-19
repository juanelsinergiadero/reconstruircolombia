'use server'

import { prisma } from '@/lib/prisma'

export type VerificarState = {
  ok: boolean
  mensaje?: string
}

// Consume un token de verificacion de correo. La verificacion SUMA
// confianza (badge visible en el perfil); nunca es requisito para usar la
// plataforma, por lo que esta accion no requiere sesion propia — solo el
// token del enlace, que ya identifica al usuario.
export async function verificarEmailToken(
  _prev: VerificarState,
  formData: FormData
): Promise<VerificarState> {
  const token = formData.get('token')
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, mensaje: 'Enlace invalido: falta el token.' }
  }

  const registro = await prisma.tokenVerificacion.findUnique({
    where: { token },
    select: { id: true, userId: true, expira: true },
  })

  if (!registro) {
    return {
      ok: false,
      mensaje: 'Este enlace ya no es valido. Si tu correo sigue sin verificar, pide uno nuevo desde tu perfil.',
    }
  }

  if (registro.expira < new Date()) {
    await prisma.tokenVerificacion.delete({ where: { id: registro.id } })
    return { ok: false, mensaje: 'Este enlace expiro. Pide uno nuevo desde tu perfil.' }
  }

  // Marca el correo verificado y consume el token (un solo uso) juntos.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: { emailVerificado: new Date() },
    }),
    prisma.tokenVerificacion.delete({ where: { id: registro.id } }),
  ])

  return { ok: true, mensaje: 'Tu correo quedo verificado. Gracias.' }
}

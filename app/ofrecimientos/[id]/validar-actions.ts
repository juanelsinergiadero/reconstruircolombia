'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// Espejo de app/necesidades/[id]/validar-actions.ts. Ver ese archivo para
// el detalle de las salvaguardas; aqui se aplican identicas mediante el
// campo ofrecimientoId (bidireccional, ver prisma/schema.prisma).

export type ValidarState = {
  ok: boolean
  mensaje?: string
}

// Validacion por pares (COMUNITARIA en v1): un usuario logueado confirma
// "me consta que esto es real". Suma confianza visible; nunca es requisito
// para que el ofrecimiento se publique.
//
// Salvaguardas anti-fraude (todas obligatorias, ver CLAUDE.md):
//  (a) requiere sesion — identidad siempre, nunca anonimo.
//  (b) no autovalidacion — el autor del ofrecimiento no puede validar el suyo.
//  (c) una validacion por usuario por ofrecimiento — el constraint unico
//      (validadorId, ofrecimientoId) en la base de datos es la garantia
//      real; aqui solo traducimos su violacion (P2002) a un mensaje claro.
export async function validarOfrecimiento(
  _prev: ValidarState,
  formData: FormData
): Promise<ValidarState> {
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para validar este ofrecimiento.' }
  }

  const ofrecimientoId = formData.get('ofrecimientoId')
  if (typeof ofrecimientoId !== 'string' || ofrecimientoId.length === 0) {
    return { ok: false, mensaje: 'Ofrecimiento invalido.' }
  }

  const ofrecimiento = await prisma.ofrecimiento.findUnique({
    where: { id: ofrecimientoId },
    select: { autorId: true },
  })
  if (!ofrecimiento) {
    return { ok: false, mensaje: 'Este ofrecimiento ya no existe.' }
  }

  // (b) No autovalidacion.
  if (ofrecimiento.autorId === usuario.id) {
    return { ok: false, mensaje: 'No puedes validar tu propio ofrecimiento.' }
  }

  try {
    await prisma.validacion.create({
      data: {
        // (a) Identidad siempre: validadorId nunca es opcional ni anonimo.
        validadorId: usuario.id,
        ofrecimientoId,
        tipo: 'COMUNITARIA',
      },
    })
  } catch (error) {
    // (c) Una validacion por usuario por ofrecimiento: P2002 es la
    // violacion del constraint unico (validadorId, ofrecimientoId).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, mensaje: 'Ya validaste este ofrecimiento.' }
    }
    return { ok: false, mensaje: 'No se pudo registrar la validacion. Intenta de nuevo.' }
  }

  revalidatePath(`/ofrecimientos/${ofrecimientoId}`)
  revalidatePath('/ofrecimientos')

  return { ok: true, mensaje: 'Gracias por confirmar este ofrecimiento.' }
}

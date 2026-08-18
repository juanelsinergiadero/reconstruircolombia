'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// Estado que la Server Action devuelve al boton de validar (useActionState).
export type ValidarState = {
  ok: boolean
  mensaje?: string
}

// Validacion por pares (COMUNITARIA en v1): un usuario logueado confirma
// "me consta que es real". Suma confianza visible; nunca es requisito para
// que la necesidad se publique o se atienda.
//
// Salvaguardas anti-fraude (todas obligatorias, ver CLAUDE.md):
//  (a) requiere sesion — identidad siempre, nunca anonimo.
//  (b) no autovalidacion — el autor de la necesidad no puede validar la suya.
//  (c) una validacion por usuario por necesidad — el constraint unico
//      (validadorId, necesidadId) en la base de datos es la garantia real;
//      aqui solo traducimos su violacion (P2002) a un mensaje claro.
export async function validarNecesidad(
  _prev: ValidarState,
  formData: FormData
): Promise<ValidarState> {
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para validar esta necesidad.' }
  }

  const necesidadId = formData.get('necesidadId')
  if (typeof necesidadId !== 'string' || necesidadId.length === 0) {
    return { ok: false, mensaje: 'Necesidad invalida.' }
  }

  const necesidad = await prisma.necesidad.findUnique({
    where: { id: necesidadId },
    select: { autorId: true },
  })
  if (!necesidad) {
    return { ok: false, mensaje: 'Esta necesidad ya no existe.' }
  }

  // (b) No autovalidacion.
  if (necesidad.autorId === usuario.id) {
    return { ok: false, mensaje: 'No puedes validar tu propia necesidad.' }
  }

  try {
    await prisma.validacion.create({
      data: {
        // (a) Identidad siempre: validadorId nunca es opcional ni anonimo.
        validadorId: usuario.id,
        necesidadId,
        tipo: 'COMUNITARIA',
      },
    })
  } catch (error) {
    // (c) Una validacion por usuario por necesidad: P2002 es la violacion
    // del constraint unico (validadorId, necesidadId).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, mensaje: 'Ya validaste esta necesidad.' }
    }
    return { ok: false, mensaje: 'No se pudo registrar la validacion. Intenta de nuevo.' }
  }

  revalidatePath(`/necesidades/${necesidadId}`)
  revalidatePath('/necesidades')

  return { ok: true, mensaje: 'Gracias por confirmar esta necesidad.' }
}

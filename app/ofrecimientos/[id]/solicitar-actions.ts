'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'
import { getBaseUrl } from '@/lib/url'
import { mensajeSolicitudSchema } from '@/lib/validations/solicitud'

// Espejo de app/necesidades/[id]/solicitar-actions.ts. Aqui quien inicia la
// solicitud es quien necesita la ayuda ofrecida (no un donante): pide que
// quien la ofrece habilite el canal de contacto. Misma logica de canal
// mediado (Modelo B): el contacto real nunca se comparte por correo, solo
// dentro de la plataforma y solo tras aceptacion.

export type SolicitarContactoState = {
  ok: boolean
  mensaje?: string
}

// Salvaguardas (identicas a las de necesidades):
//  (a) requiere sesion — identidad siempre, nunca anonimo.
//  (b) no autosolicitud — el autor del ofrecimiento no puede pedirse
//      contacto a si mismo.
//  (c) una solicitud por solicitante por ofrecimiento — constraint unico
//      (solicitanteId, ofrecimientoId); aqui solo traducimos su violacion
//      (P2002) a un mensaje claro.
export async function solicitarContactoOfrecimiento(
  _prev: SolicitarContactoState,
  formData: FormData
): Promise<SolicitarContactoState> {
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para solicitar contacto.' }
  }

  const ofrecimientoId = formData.get('ofrecimientoId')
  if (typeof ofrecimientoId !== 'string' || ofrecimientoId.length === 0) {
    return { ok: false, mensaje: 'Ofrecimiento invalido.' }
  }

  const parsedMensaje = mensajeSolicitudSchema.safeParse(formData.get('mensaje') ?? '')
  if (!parsedMensaje.success) {
    return { ok: false, mensaje: 'Revisa el mensaje: es muy largo.' }
  }
  const mensaje = parsedMensaje.data && parsedMensaje.data.length > 0 ? parsedMensaje.data : null

  // (autorId real de BD, nunca confiar en el cliente).
  const ofrecimiento = await prisma.ofrecimiento.findUnique({
    where: { id: ofrecimientoId },
    select: {
      descripcion: true,
      autorId: true,
      autor: { select: { email: true, nombre: true } },
    },
  })
  if (!ofrecimiento) {
    return { ok: false, mensaje: 'Este ofrecimiento ya no existe.' }
  }

  // (b) No autosolicitud.
  if (ofrecimiento.autorId === usuario.id) {
    return { ok: false, mensaje: 'No puedes solicitar contacto en tu propio ofrecimiento.' }
  }

  try {
    await prisma.solicitudContacto.create({
      data: {
        // (a) Identidad siempre: solicitanteId nunca es opcional ni anonimo.
        solicitanteId: usuario.id,
        ofrecimientoId,
        mensaje,
      },
    })
  } catch (error) {
    // (c) Una solicitud por solicitante por ofrecimiento.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, mensaje: 'Ya enviaste una solicitud para este ofrecimiento.' }
    }
    return { ok: false, mensaje: 'No se pudo enviar la solicitud. Intenta de nuevo.' }
  }

  // Correo a quien ofrece: solo aviso, jamas el contacto de nadie. Si falla
  // no rompe el flujo (ver enviarCorreo, que nunca lanza).
  if (ofrecimiento.autor.email) {
    const enlace = `${getBaseUrl()}/ofrecimientos/${ofrecimientoId}`
    await enviarCorreo({
      para: ofrecimiento.autor.email,
      asunto: 'Alguien esta interesado en tu ofrecimiento — reconstruircolombia',
      html: `<p>Hola${ofrecimiento.autor.nombre ? ' ' + ofrecimiento.autor.nombre : ''},</p><p>Alguien de la comunidad esta interesado en tu ofrecimiento de ayuda. Entra a la plataforma para ver la solicitud y decidir si la aceptas.</p><p><a href="${enlace}">Ver la solicitud</a></p>`,
      texto: `Alguien esta interesado en tu ofrecimiento de ayuda. Entra a ${enlace} para ver la solicitud y decidir si la aceptas.`,
    })
  }

  revalidatePath(`/ofrecimientos/${ofrecimientoId}`)

  return { ok: true, mensaje: 'Tu solicitud fue enviada. Te avisaremos si es aceptada.' }
}

export type ResponderSolicitudState = {
  ok: boolean
  mensaje?: string
}

// Quien ofrece la ayuda acepta o rechaza una solicitud recibida.
// Salvaguarda: solo el autor real (de BD) puede responder, nunca el
// solicitante ni un tercero.
export async function responderSolicitudOfrecimiento(
  _prev: ResponderSolicitudState,
  formData: FormData
): Promise<ResponderSolicitudState> {
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para responder.' }
  }

  const solicitudId = formData.get('solicitudId')
  if (typeof solicitudId !== 'string' || solicitudId.length === 0) {
    return { ok: false, mensaje: 'Solicitud invalida.' }
  }

  const decision = formData.get('decision')
  if (decision !== 'ACEPTADA' && decision !== 'RECHAZADA') {
    return { ok: false, mensaje: 'Decision invalida.' }
  }

  const solicitud = await prisma.solicitudContacto.findUnique({
    where: { id: solicitudId },
    select: {
      id: true,
      estado: true,
      ofrecimientoId: true,
      ofrecimiento: {
        select: {
          autorId: true,
          autor: { select: { email: true } },
        },
      },
      solicitante: { select: { email: true } },
    },
  })
  if (!solicitud || !solicitud.ofrecimientoId || !solicitud.ofrecimiento) {
    return { ok: false, mensaje: 'Esta solicitud ya no existe.' }
  }

  // Solo el autor del ofrecimiento puede responder.
  if (solicitud.ofrecimiento.autorId !== usuario.id) {
    return { ok: false, mensaje: 'No tienes permiso para responder esta solicitud.' }
  }

  if (solicitud.estado !== 'PENDIENTE') {
    return { ok: false, mensaje: 'Esta solicitud ya fue respondida.' }
  }

  await prisma.solicitudContacto.update({
    where: { id: solicitudId },
    data: { estado: decision, respondidaEn: new Date() },
  })

  if (decision === 'ACEPTADA') {
    // Correo a ambos: solo aviso, el contacto se revela dentro de la
    // plataforma (detalle del ofrecimiento y /mis-solicitudes), no aqui.
    const enlaceOfrecimiento = `${getBaseUrl()}/ofrecimientos/${solicitud.ofrecimientoId}`
    const enlaceMisSolicitudes = `${getBaseUrl()}/mis-solicitudes`

    if (solicitud.solicitante.email) {
      await enviarCorreo({
        para: solicitud.solicitante.email,
        asunto: 'Tu solicitud fue aceptada — reconstruircolombia',
        html: `<p>Tu solicitud de contacto para el ofrecimiento de ayuda fue aceptada. Entra a la plataforma para ver como contactar.</p><p><a href="${enlaceMisSolicitudes}">Ver mis solicitudes</a></p>`,
        texto: `Tu solicitud de contacto fue aceptada. Entra a ${enlaceMisSolicitudes} para ver como contactar.`,
      })
    }

    if (solicitud.ofrecimiento.autor.email) {
      await enviarCorreo({
        para: solicitud.ofrecimiento.autor.email,
        asunto: 'Aceptaste una solicitud de contacto — reconstruircolombia',
        html: `<p>Aceptaste una solicitud de contacto para tu ofrecimiento de ayuda. Entra a la plataforma para ver como contactar.</p><p><a href="${enlaceOfrecimiento}">Ver el ofrecimiento</a></p>`,
        texto: `Aceptaste una solicitud de contacto para tu ofrecimiento de ayuda. Entra a ${enlaceOfrecimiento} para ver como contactar.`,
      })
    }
  }

  revalidatePath(`/ofrecimientos/${solicitud.ofrecimientoId}`)
  revalidatePath('/mis-solicitudes')

  return {
    ok: true,
    mensaje: decision === 'ACEPTADA' ? 'Aceptaste la solicitud.' : 'Rechazaste la solicitud.',
  }
}

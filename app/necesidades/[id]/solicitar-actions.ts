'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'
import { getBaseUrl } from '@/lib/url'
import { mensajeSolicitudSchema } from '@/lib/validations/solicitud'

// Canal de contacto mediado (Modelo B): el contacto real nunca se comparte
// por correo. El correo solo avisa que hay actividad y enlaza a la
// plataforma, donde el contacto se revela tras login y solo si la
// solicitud fue ACEPTADA (ver page.tsx y /mis-solicitudes).

export type SolicitarContactoState = {
  ok: boolean
  mensaje?: string
}

// Un donante pide que el autor de la necesidad habilite el contacto.
// Salvaguardas:
//  (a) requiere sesion — identidad siempre, nunca anonimo.
//  (b) no autosolicitud — el autor no puede pedirse contacto a si mismo.
//  (c) una solicitud por donante por necesidad — constraint unico
//      (solicitanteId, necesidadId); aqui solo traducimos su violacion
//      (P2002) a un mensaje claro.
export async function solicitarContacto(
  _prev: SolicitarContactoState,
  formData: FormData
): Promise<SolicitarContactoState> {
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para solicitar contacto.' }
  }

  const necesidadId = formData.get('necesidadId')
  if (typeof necesidadId !== 'string' || necesidadId.length === 0) {
    return { ok: false, mensaje: 'Necesidad invalida.' }
  }

  const parsedMensaje = mensajeSolicitudSchema.safeParse(formData.get('mensaje') ?? '')
  if (!parsedMensaje.success) {
    return { ok: false, mensaje: 'Revisa el mensaje: es muy largo.' }
  }
  const mensaje = parsedMensaje.data && parsedMensaje.data.length > 0 ? parsedMensaje.data : null

  // (autorId real de BD, nunca confiar en el cliente).
  const necesidad = await prisma.necesidad.findUnique({
    where: { id: necesidadId },
    select: {
      titulo: true,
      autorId: true,
      autor: { select: { email: true, nombre: true } },
    },
  })
  if (!necesidad) {
    return { ok: false, mensaje: 'Esta necesidad ya no existe.' }
  }

  // (b) No autosolicitud.
  if (necesidad.autorId === usuario.id) {
    return { ok: false, mensaje: 'No puedes solicitar contacto en tu propia necesidad.' }
  }

  try {
    await prisma.solicitudContacto.create({
      data: {
        // (a) Identidad siempre: solicitanteId nunca es opcional ni anonimo.
        solicitanteId: usuario.id,
        necesidadId,
        mensaje,
      },
    })
  } catch (error) {
    // (c) Una solicitud por donante por necesidad.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, mensaje: 'Ya enviaste una solicitud para esta necesidad.' }
    }
    return { ok: false, mensaje: 'No se pudo enviar la solicitud. Intenta de nuevo.' }
  }

  // Correo al damnificado: solo aviso, jamas el contacto de nadie. Si falla
  // no rompe el flujo (ver enviarCorreo, que nunca lanza).
  if (necesidad.autor.email) {
    const enlace = `${getBaseUrl()}/necesidades/${necesidadId}`
    await enviarCorreo({
      para: necesidad.autor.email,
      asunto: 'Alguien quiere ayudarte — reconstruircolombia',
      html: `<p>Hola${necesidad.autor.nombre ? ' ' + necesidad.autor.nombre : ''},</p><p>Alguien de la comunidad quiere ayudarte con tu necesidad "${necesidad.titulo}". Entra a la plataforma para ver la solicitud y decidir si la aceptas.</p><p><a href="${enlace}">Ver la solicitud</a></p>`,
      texto: `Alguien quiere ayudarte con tu necesidad "${necesidad.titulo}". Entra a ${enlace} para ver la solicitud y decidir si la aceptas.`,
    })
  }

  revalidatePath(`/necesidades/${necesidadId}`)

  return { ok: true, mensaje: 'Tu solicitud fue enviada. Te avisaremos si es aceptada.' }
}

export type ResponderSolicitudState = {
  ok: boolean
  mensaje?: string
}

// El autor de la necesidad acepta o rechaza una solicitud recibida.
// Salvaguarda: solo el autor real (de BD) puede responder, nunca el
// solicitante ni un tercero.
export async function responderSolicitud(
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
      necesidadId: true,
      necesidad: {
        select: {
          titulo: true,
          autorId: true,
          autor: { select: { email: true } },
        },
      },
      solicitante: { select: { email: true } },
    },
  })
  if (!solicitud) {
    return { ok: false, mensaje: 'Esta solicitud ya no existe.' }
  }

  // Solo el autor de la necesidad puede responder.
  if (solicitud.necesidad.autorId !== usuario.id) {
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
    // plataforma (detalle de la necesidad y /mis-solicitudes), no aqui.
    const enlaceNecesidad = `${getBaseUrl()}/necesidades/${solicitud.necesidadId}`
    const enlaceMisSolicitudes = `${getBaseUrl()}/mis-solicitudes`

    if (solicitud.solicitante.email) {
      await enviarCorreo({
        para: solicitud.solicitante.email,
        asunto: 'Tu solicitud fue aceptada — reconstruircolombia',
        html: `<p>Tu solicitud para ayudar con "${solicitud.necesidad.titulo}" fue aceptada. Entra a la plataforma para ver como contactar.</p><p><a href="${enlaceMisSolicitudes}">Ver mis solicitudes</a></p>`,
        texto: `Tu solicitud para ayudar con "${solicitud.necesidad.titulo}" fue aceptada. Entra a ${enlaceMisSolicitudes} para ver como contactar.`,
      })
    }

    if (solicitud.necesidad.autor.email) {
      await enviarCorreo({
        para: solicitud.necesidad.autor.email,
        asunto: 'Aceptaste una solicitud de contacto — reconstruircolombia',
        html: `<p>Aceptaste la solicitud de ayuda para "${solicitud.necesidad.titulo}". Entra a la plataforma para ver como contactar.</p><p><a href="${enlaceNecesidad}">Ver la necesidad</a></p>`,
        texto: `Aceptaste la solicitud de ayuda para "${solicitud.necesidad.titulo}". Entra a ${enlaceNecesidad} para ver como contactar.`,
      })
    }
  }

  revalidatePath(`/necesidades/${solicitud.necesidadId}`)
  revalidatePath('/mis-solicitudes')

  return {
    ok: true,
    mensaje: decision === 'ACEPTADA' ? 'Aceptaste la solicitud.' : 'Rechazaste la solicitud.',
  }
}

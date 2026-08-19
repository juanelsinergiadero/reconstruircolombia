import { z } from 'zod'

// Mensaje opcional que el donante deja al pedir contacto (por que quiere
// ayudar, con que). Se valida en la Server Action; el vacio se guarda null.
export const mensajeSolicitudSchema = z
  .string()
  .trim()
  .max(500, 'El mensaje no puede exceder 500 caracteres')
  .optional()
  .or(z.literal(''))

export const ESTADOS_SOLICITUD = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'] as const

export const ESTADO_SOLICITUD_LABEL: Record<(typeof ESTADOS_SOLICITUD)[number], string> = {
  PENDIENTE: 'Pendiente de respuesta',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
}

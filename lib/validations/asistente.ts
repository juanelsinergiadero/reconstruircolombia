import { z } from 'zod'

// Limites del endpoint del asistente: mensajes cortos (es un chat, no un
// formulario) y un historial acotado para no dejar que el cliente infle el
// contexto que se manda a Groq en cada peticion.
export const LONGITUD_MAXIMA_MENSAJE = 800
const MAXIMO_MENSAJES_HISTORIAL = 12

const mensajeHistorialSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(LONGITUD_MAXIMA_MENSAJE),
})

export const peticionAsistenteSchema = z.object({
  mensaje: z
    .string()
    .trim()
    .min(1, 'Escribe un mensaje.')
    .max(LONGITUD_MAXIMA_MENSAJE, `El mensaje no puede superar ${LONGITUD_MAXIMA_MENSAJE} caracteres.`),
  historial: z.array(mensajeHistorialSchema).max(MAXIMO_MENSAJES_HISTORIAL).default([]),
})

export type PeticionAsistente = z.infer<typeof peticionAsistenteSchema>

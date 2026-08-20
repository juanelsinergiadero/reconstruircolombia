import { z } from 'zod'
import { CATEGORIAS, CATEGORIA_LABEL } from './necesidad'

// Esquema de validacion de un Ofrecimiento (espejo de Necesidad, ver
// lib/validations/necesidad.ts). Misma categoria (clusteres ONU/Esfera):
// un ofrecimiento se clasifica por la necesidad que busca cubrir.
export { CATEGORIAS, CATEGORIA_LABEL }

export const TIPOS_AYUDA = ['MATERIAL', 'SERVICIO'] as const

export const TIPO_AYUDA_LABEL: Record<(typeof TIPOS_AYUDA)[number], string> = {
  MATERIAL: 'Ayuda material (bienes)',
  SERVICIO: 'Ayuda de servicio (labor)',
}

export const ESTADOS_OFRECIMIENTO = ['ACTIVO', 'PAUSADO', 'CERRADO'] as const

export const ESTADO_OFRECIMIENTO_LABEL: Record<(typeof ESTADOS_OFRECIMIENTO)[number], string> = {
  ACTIVO: 'Activo',
  PAUSADO: 'Pausado',
  CERRADO: 'Cerrado',
}

// Un checkbox de FormData llega como 'on' (marcado) o ausente (desmarcado).
// (No se usa aqui todavia, pero se mantiene el mismo estilo que necesidad.ts
// por si un futuro campo booleano lo requiere.)

export const ofrecimientoSchema = z
  .object({
    tipoAyuda: z.enum(TIPOS_AYUDA, {
      message: 'Selecciona un tipo de ayuda valido',
    }),
    categoria: z.enum(CATEGORIAS, {
      message: 'Selecciona una categoria valida',
    }),
    descripcion: z
      .string()
      .trim()
      .min(15, 'Describe el ofrecimiento con al menos 15 caracteres')
      .max(2000, 'La descripcion no puede exceder 2000 caracteres'),
    // Texto libre: "20 kits de aseo", "3 dias/semana de transporte", etc.
    capacidad: z.string().trim().max(200).optional().or(z.literal('')),
    // Codigo DIVIPOLA de municipio: exactamente 5 digitos.
    municipioCodigo: z
      .string()
      .regex(/^\d{5}$/, 'Selecciona un municipio valido'),
    // Contacto: sensible. Cada campo es opcional por separado, pero el
    // refine de abajo exige al menos un medio real (telefono o correo).
    contactoNombre: z.string().trim().max(120).optional().or(z.literal('')),
    contactoTelefono: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),
    contactoEmail: z
      .string()
      .trim()
      .email('Correo invalido')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => Boolean(data.contactoTelefono) || Boolean(data.contactoEmail), {
    message: 'Deja al menos un telefono o correo para que puedan contactarte.',
    path: ['contactoTelefono'],
  })

// Tipo inferido para usar en la Server Action y el formulario.
export type OfrecimientoInput = z.infer<typeof ofrecimientoSchema>

// Etiqueta del conteo de validaciones por pares, compartida entre el
// listado y el detalle. Misma logica que respaldoLabel en necesidad.ts.
export function respaldoLabel(numValidaciones: number): string | null {
  if (numValidaciones <= 0) return null
  return numValidaciones === 1
    ? 'Respaldado por 1 persona de la comunidad'
    : `Respaldado por ${numValidaciones} personas de la comunidad`
}

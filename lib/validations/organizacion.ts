import { z } from 'zod'

// Esquema de validacion de una Organizacion (v1, nivel REGISTRADA).
// Los enums reflejan exactamente el schema.prisma. Si cambian alli, aqui.

export const TIPOS_ORGANIZACION = [
  'INSTITUCION_EDUCATIVA',
  'JAC',
  'FUNDACION',
  'COLECTIVO',
  'ENTIDAD_OFICIAL',
  'OTRA',
] as const

export const ESTADOS_ORGANIZACION = ['REGISTRADA', 'VERIFICADA'] as const

export const TIPO_ORGANIZACION_LABEL: Record<(typeof TIPOS_ORGANIZACION)[number], string> = {
  INSTITUCION_EDUCATIVA: 'Institucion educativa',
  JAC: 'Junta de Accion Comunal (JAC)',
  FUNDACION: 'Fundacion',
  COLECTIVO: 'Colectivo',
  ENTIDAD_OFICIAL: 'Entidad oficial',
  OTRA: 'Otra',
}

export const ESTADO_ORGANIZACION_LABEL: Record<(typeof ESTADOS_ORGANIZACION)[number], string> = {
  REGISTRADA: 'Registrada',
  VERIFICADA: 'Verificada',
}

// Contacto institucional: a diferencia del contacto de una Necesidad, NO es
// dato de una persona damnificada. Es publico por diseño (asi un donante o
// voluntario puede llegar a la organizacion sin pasar por moderacion).
export const organizacionSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(150, 'El nombre no puede exceder 150 caracteres'),
    tipo: z.enum(TIPOS_ORGANIZACION, {
      message: 'Selecciona un tipo de organizacion valido',
    }),
    descripcion: z
      .string()
      .trim()
      .max(1000, 'La descripcion no puede exceder 1000 caracteres')
      .optional()
      .or(z.literal('')),
    contactoEmail: z
      .string()
      .trim()
      .email('Correo invalido')
      .optional()
      .or(z.literal('')),
    contactoTelefono: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),
    // Codigo DIVIPOLA de municipio: exactamente 5 digitos.
    municipioCodigo: z
      .string()
      .regex(/^\d{5}$/, 'Selecciona un municipio valido'),
  })
  .refine((data) => Boolean(data.contactoEmail) || Boolean(data.contactoTelefono), {
    message: 'Deja al menos un correo o telefono para que puedan contactar a la organizacion.',
    path: ['contactoEmail'],
  })

export type OrganizacionInput = z.infer<typeof organizacionSchema>

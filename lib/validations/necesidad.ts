import { z } from 'zod'

// Esquema de validacion de una Necesidad (v1).
// Primera linea de defensa contra datos basura o maliciosos: se valida
// tanto en la Server Action (servidor, obligatorio) como opcionalmente
// en el cliente para feedback inmediato.

// Los enums reflejan exactamente el schema.prisma. Si cambian alli, aqui.
export const CATEGORIAS = [
  'AGUA',
  'ALIMENTOS',
  'SALUD',
  'REFUGIO',
  'ROPA',
  'HIGIENE',
  'RESCATE',
  'OTRO',
] as const

export const URGENCIAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const

export const necesidadSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, 'El titulo debe tener al menos 5 caracteres')
    .max(120, 'El titulo no puede exceder 120 caracteres'),
  descripcion: z
    .string()
    .trim()
    .min(15, 'Describe la necesidad con al menos 15 caracteres')
    .max(2000, 'La descripcion no puede exceder 2000 caracteres'),
  categoria: z.enum(CATEGORIAS, {
    message: 'Selecciona una categoria valida',
  }),
  urgencia: z.enum(URGENCIAS, {
    message: 'Selecciona un nivel de urgencia valido',
  }),
  // Codigo DIVIPOLA de municipio: exactamente 5 digitos.
  municipioCodigo: z
    .string()
    .regex(/^\d{5}$/, 'Selecciona un municipio valido'),
  numPersonas: z.coerce
    .number()
    .int('Debe ser un numero entero')
    .min(1, 'Debe ser al menos 1 persona')
    .max(10000, 'Numero de personas fuera de rango'),
  // Contacto: sensible. Al menos un medio de contacto debe existir para
  // que la ayuda pueda llegar, pero cada campo es opcional por separado.
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

// Tipo inferido para usar en la Server Action y el formulario.
export type NecesidadInput = z.infer<typeof necesidadSchema>

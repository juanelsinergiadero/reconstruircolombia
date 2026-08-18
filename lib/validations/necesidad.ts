import { z } from 'zod'

// Esquema de validacion de una Necesidad (v1).
// Primera linea de defensa contra datos basura o maliciosos: se valida
// tanto en la Server Action (servidor, obligatorio) como opcionalmente
// en el cliente para feedback inmediato.

// Los enums reflejan exactamente el schema.prisma. Si cambian alli, aqui.
// Categorias alineadas a clusteres ONU/Esfera, en lenguaje de la persona.
export const CATEGORIAS = [
  'AGUA_SANEAMIENTO',
  'ALIMENTOS',
  'ALOJAMIENTO',
  'SALUD',
  'HIGIENE',
  'ROPA_ABRIGO',
  'PROTECCION',
  'EDUCACION',
  'RESCATE',
  'OTRO',
] as const

export const URGENCIAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const

// Quien reporta: la propia persona afectada, o alguien en su nombre.
export const TIPOS_REPORTE = ['PROPIA', 'EN_NOMBRE_DE'] as const

// Etiquetas legibles, compartidas entre el formulario de registro y el
// listado publico (evita duplicar el mapeo en un componente cliente y
// otro servidor).
export const CATEGORIA_LABEL: Record<(typeof CATEGORIAS)[number], string> = {
  AGUA_SANEAMIENTO: 'Agua y saneamiento',
  ALIMENTOS: 'Alimentos',
  ALOJAMIENTO: 'Alojamiento',
  SALUD: 'Salud',
  HIGIENE: 'Higiene',
  ROPA_ABRIGO: 'Ropa y abrigo',
  PROTECCION: 'Proteccion',
  EDUCACION: 'Educacion',
  RESCATE: 'Rescate',
  OTRO: 'Otro',
}

export const URGENCIA_LABEL: Record<(typeof URGENCIAS)[number], string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
}

export const TIPO_REPORTE_LABEL: Record<(typeof TIPOS_REPORTE)[number], string> = {
  PROPIA: 'Es mi propia necesidad',
  EN_NOMBRE_DE: 'La reporto en nombre de otra persona',
}

// Poblacion vulnerable: booleanos en Necesidad, para priorizar sin exponer
// detalle. Un solo listado ordena el mapeo campo -> etiqueta -> nombre de
// FormData, para no repetirlo en el formulario y en la Server Action.
export const POBLACION_VULNERABLE_CAMPOS = [
  { campo: 'hayMenores', etiqueta: 'Hay menores de edad' },
  { campo: 'hayAdultosMayores', etiqueta: 'Hay adultos mayores' },
  { campo: 'hayPersonasDiscapacidad', etiqueta: 'Hay personas con discapacidad' },
  { campo: 'hayGestantes', etiqueta: 'Hay mujeres gestantes' },
  { campo: 'hayEnfermosCronicos', etiqueta: 'Hay personas con enfermedades cronicas' },
] as const

// Un checkbox de FormData llega como 'on' (marcado) o ausente (desmarcado).
const checkboxBooleano = z.preprocess((v) => v === 'on' || v === true, z.boolean())

export const necesidadSchema = z
  .object({
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
    tipoReporte: z.enum(TIPOS_REPORTE, {
      message: 'Indica quien reporta esta necesidad',
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
    hayMenores: checkboxBooleano,
    hayAdultosMayores: checkboxBooleano,
    hayPersonasDiscapacidad: checkboxBooleano,
    hayGestantes: checkboxBooleano,
    hayEnfermosCronicos: checkboxBooleano,
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
    message: 'Deja al menos un telefono o correo para que la ayuda pueda contactarte.',
    path: ['contactoTelefono'],
  })

// Tipo inferido para usar en la Server Action y el formulario.
export type NecesidadInput = z.infer<typeof necesidadSchema>

// Etiqueta del conteo de validaciones por pares, compartida entre el
// listado y el detalle. La validacion SUMA confianza visible, nunca es
// requisito: por eso no hay etiqueta para "0 validaciones" (ausencia no
// implica invalidez).
export function respaldoLabel(numValidaciones: number): string | null {
  if (numValidaciones <= 0) return null
  return numValidaciones === 1
    ? 'Respaldada por 1 persona de la comunidad'
    : `Respaldada por ${numValidaciones} personas de la comunidad`
}

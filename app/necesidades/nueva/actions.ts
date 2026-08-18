'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { municipioExiste, getMunicipiosPorDepartamento } from '@/lib/geo'
import { necesidadSchema } from '@/lib/validations/necesidad'

// Server Action invocada directamente (no como form action) desde el
// selector jerarquico del formulario: al elegir departamento, trae sus
// municipios para poblar el segundo <select>.
export async function obtenerMunicipios(departamentoCodigo: string) {
  return getMunicipiosPorDepartamento(departamentoCodigo)
}

// Estado que la Server Action devuelve al formulario (useActionState).
export type CrearNecesidadState = {
  ok: boolean
  // Errores por campo (de Zod) para mostrar junto a cada input.
  errores?: Record<string, string[]>
  // Mensaje general (p. ej. municipio inexistente o fallo de servidor).
  mensaje?: string
}

export async function crearNecesidad(
  _prev: CrearNecesidadState,
  formData: FormData
): Promise<CrearNecesidadState> {
  // Registrar una necesidad requiere sesion (decision de producto v1).
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para registrar una necesidad.' }
  }

  // 1. Validacion de forma con Zod (servidor, obligatoria).
  const parsed = necesidadSchema.safeParse({
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    categoria: formData.get('categoria'),
    urgencia: formData.get('urgencia'),
    municipioCodigo: formData.get('municipioCodigo'),
    numPersonas: formData.get('numPersonas'),
    contactoNombre: formData.get('contactoNombre') ?? '',
    contactoTelefono: formData.get('contactoTelefono') ?? '',
    contactoEmail: formData.get('contactoEmail') ?? '',
  })

  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.flatten().fieldErrors,
      mensaje: 'Revisa los campos marcados.',
    }
  }

  const data = parsed.data

  // 2. Validacion de integridad: el municipio debe existir en DIVIPOLA.
  const existe = await municipioExiste(data.municipioCodigo)
  if (!existe) {
    return {
      ok: false,
      errores: { municipioCodigo: ['El municipio seleccionado no es valido.'] },
    }
  }

  // 3. Persistir. Campos de contacto vacios se guardan como null.
  const vacioANull = (v?: string) => (v && v.length > 0 ? v : null)

  try {
    await prisma.necesidad.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        urgencia: data.urgencia,
        numPersonas: data.numPersonas,
        municipioCodigo: data.municipioCodigo,
        autorId: usuario.id,
        contactoNombre: vacioANull(data.contactoNombre),
        contactoTelefono: vacioANull(data.contactoTelefono),
        contactoEmail: vacioANull(data.contactoEmail),
      },
    })
  } catch {
    return {
      ok: false,
      mensaje: 'No se pudo guardar la necesidad. Intenta de nuevo.',
    }
  }

  // 4. Refrescar el listado publico y llevar al usuario alli.
  revalidatePath('/necesidades')
  redirect('/necesidades')
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { municipioExiste, getMunicipiosPorDepartamento } from '@/lib/geo'
import { organizacionSchema } from '@/lib/validations/organizacion'

// Server Action invocada directamente (no como form action) desde el
// selector jerarquico del formulario: al elegir departamento, trae sus
// municipios para poblar el segundo <select>.
export async function obtenerMunicipios(departamentoCodigo: string) {
  return getMunicipiosPorDepartamento(departamentoCodigo)
}

// Estado que la Server Action devuelve al formulario (useActionState).
export type CrearOrganizacionState = {
  ok: boolean
  // Errores por campo (de Zod) para mostrar junto a cada input.
  errores?: Record<string, string[]>
  // Mensaje general (p. ej. municipio inexistente o fallo de servidor).
  mensaje?: string
}

export async function crearOrganizacion(
  _prev: CrearOrganizacionState,
  formData: FormData
): Promise<CrearOrganizacionState> {
  // Registrar una organizacion requiere sesion (decision de producto v1).
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para registrar una organizacion.' }
  }

  // Un usuario pertenece a UNA organizacion (modelo v1). Si ya tiene una,
  // no dejamos crear otra: v1 no tiene flujo de "unirse a una existente",
  // asi que crear una segunda solo generaria duplicados confusos.
  const usuarioActual = await prisma.user.findUnique({
    where: { id: usuario.id },
    select: { organizacionId: true },
  })
  if (usuarioActual?.organizacionId) {
    return {
      ok: false,
      mensaje: 'Ya perteneces a una organizacion. No puedes registrar otra.',
    }
  }

  // 1. Validacion de forma con Zod (servidor, obligatoria).
  const parsed = organizacionSchema.safeParse({
    nombre: formData.get('nombre'),
    tipo: formData.get('tipo'),
    descripcion: formData.get('descripcion') ?? '',
    contactoEmail: formData.get('contactoEmail') ?? '',
    contactoTelefono: formData.get('contactoTelefono') ?? '',
    municipioCodigo: formData.get('municipioCodigo'),
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

  // 3. Persistir. Campos opcionales vacios se guardan como null.
  const vacioANull = (v?: string) => (v && v.length > 0 ? v : null)

  let organizacionId: string
  try {
    const organizacion = await prisma.organizacion.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        descripcion: vacioANull(data.descripcion),
        contactoEmail: vacioANull(data.contactoEmail),
        contactoTelefono: vacioANull(data.contactoTelefono),
        municipioCodigo: data.municipioCodigo,
      },
      select: { id: true },
    })
    organizacionId = organizacion.id

    // El usuario que la crea queda vinculado a ella de inmediato.
    await prisma.user.update({
      where: { id: usuario.id },
      data: { organizacionId },
    })
  } catch {
    return {
      ok: false,
      mensaje: 'No se pudo guardar la organizacion. Intenta de nuevo.',
    }
  }

  // 4. Refrescar el listado publico y llevar a la persona al detalle.
  revalidatePath('/organizaciones')
  redirect(`/organizaciones/${organizacionId}`)
}

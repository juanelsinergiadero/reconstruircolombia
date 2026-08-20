'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { municipioExiste, getMunicipiosPorDepartamento } from '@/lib/geo'
import { ofrecimientoSchema } from '@/lib/validations/ofrecimiento'

// Server Action invocada directamente (no como form action) desde el
// selector jerarquico del formulario: al elegir departamento, trae sus
// municipios para poblar el segundo <select>. Espejo de necesidades/nueva.
export async function obtenerMunicipios(departamentoCodigo: string) {
  return getMunicipiosPorDepartamento(departamentoCodigo)
}

// Estado que la Server Action devuelve al formulario (useActionState).
export type CrearOfrecimientoState = {
  ok: boolean
  errores?: Record<string, string[]>
  mensaje?: string
}

export async function crearOfrecimiento(
  _prev: CrearOfrecimientoState,
  formData: FormData
): Promise<CrearOfrecimientoState> {
  // Ofrecer ayuda requiere sesion, igual que registrar una necesidad: una
  // persona sola, o alguien vinculado a una organizacion registrada.
  const usuario = await getAuthUser()
  if (!usuario) {
    return { ok: false, mensaje: 'Debes iniciar sesion para ofrecer ayuda.' }
  }

  // 1. Validacion de forma con Zod (servidor, obligatoria).
  const parsed = ofrecimientoSchema.safeParse({
    tipoAyuda: formData.get('tipoAyuda'),
    categoria: formData.get('categoria'),
    descripcion: formData.get('descripcion'),
    capacidad: formData.get('capacidad') ?? '',
    municipioCodigo: formData.get('municipioCodigo'),
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

  // 3. Si el usuario pertenece a una organizacion, el ofrecimiento queda
  // vinculado a ella automaticamente (dato de BD, nunca confiar en el
  // cliente para esto).
  const usuarioCompleto = await prisma.user.findUnique({
    where: { id: usuario.id },
    select: { organizacionId: true },
  })

  // 4. Persistir. Campos de contacto vacios se guardan como null.
  const vacioANull = (v?: string) => (v && v.length > 0 ? v : null)

  try {
    await prisma.ofrecimiento.create({
      data: {
        tipoAyuda: data.tipoAyuda,
        categoria: data.categoria,
        descripcion: data.descripcion,
        capacidad: vacioANull(data.capacidad),
        municipioCodigo: data.municipioCodigo,
        autorId: usuario.id,
        organizacionId: usuarioCompleto?.organizacionId ?? null,
        contactoNombre: vacioANull(data.contactoNombre),
        contactoTelefono: vacioANull(data.contactoTelefono),
        contactoEmail: vacioANull(data.contactoEmail),
      },
    })
  } catch {
    return {
      ok: false,
      mensaje: 'No se pudo guardar el ofrecimiento. Intenta de nuevo.',
    }
  }

  // 5. Refrescar el listado publico y llevar al usuario alli.
  revalidatePath('/ofrecimientos')
  redirect('/ofrecimientos')
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ESTADO_SOLICITUD_LABEL } from '@/lib/validations/solicitud'

export const metadata = {
  title: 'Mis solicitudes — reconstruircolombia',
}

// Vista de quien solicita: sus solicitudes de contacto enviadas y su
// estado — tanto a necesidades (como donante) como a ofrecimientos (como
// quien necesita esa ayuda), pues SolicitudContacto es bidireccional (ver
// prisma/schema.prisma). El contacto de la otra parte (contactoX de la
// necesidad/ofrecimiento, o el de su cuenta si no dejo uno especifico)
// SOLO se pinta en las filas ya ACEPTADAS.
export default async function MisSolicitudesPage() {
  const usuario = await getAuthUser()
  if (!usuario) {
    redirect('/sign-in?callbackUrl=/mis-solicitudes')
  }

  const solicitudes = await prisma.solicitudContacto.findMany({
    where: { solicitanteId: usuario.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      estado: true,
      mensaje: true,
      createdAt: true,
      necesidad: {
        select: {
          id: true,
          titulo: true,
          contactoNombre: true,
          contactoTelefono: true,
          contactoEmail: true,
          autor: { select: { nombre: true, email: true, telefono: true } },
        },
      },
      ofrecimiento: {
        select: {
          id: true,
          descripcion: true,
          contactoNombre: true,
          contactoTelefono: true,
          contactoEmail: true,
          autor: { select: { nombre: true, email: true, telefono: true } },
        },
      },
    },
  })

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Mis solicitudes</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Solicitudes de contacto que has enviado — para ayudar con una
          necesidad, o para pedir una ayuda que alguien ofrece. El contacto
          solo aparece aqui una vez que la otra parte la acepta.
        </p>

        {solicitudes.length === 0 && (
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
            Aun no has enviado solicitudes.{' '}
            <Link href="/necesidades" className="underline underline-offset-2">
              Ver necesidades
            </Link>{' '}
            o{' '}
            <Link href="/ofrecimientos" className="underline underline-offset-2">
              ver ofrecimientos
            </Link>
            .
          </p>
        )}

        <ul className="mt-8 flex flex-col gap-4">
          {solicitudes.map((solicitud) => {
            // Bidireccional: exactamente uno de los dos esta presente
            // (garantizado por el CHECK constraint, ver prisma/schema.prisma).
            const objetivo = solicitud.necesidad
              ? {
                  href: `/necesidades/${solicitud.necesidad.id}`,
                  titulo: solicitud.necesidad.titulo,
                  nombreContacto: solicitud.necesidad.contactoNombre ?? solicitud.necesidad.autor.nombre,
                  telefonoContacto: solicitud.necesidad.contactoTelefono ?? solicitud.necesidad.autor.telefono,
                  emailContacto: solicitud.necesidad.contactoEmail ?? solicitud.necesidad.autor.email,
                }
              : solicitud.ofrecimiento
                ? {
                    href: `/ofrecimientos/${solicitud.ofrecimiento.id}`,
                    titulo: solicitud.ofrecimiento.descripcion.slice(0, 80),
                    nombreContacto:
                      solicitud.ofrecimiento.contactoNombre ?? solicitud.ofrecimiento.autor.nombre,
                    telefonoContacto:
                      solicitud.ofrecimiento.contactoTelefono ?? solicitud.ofrecimiento.autor.telefono,
                    emailContacto: solicitud.ofrecimiento.contactoEmail ?? solicitud.ofrecimiento.autor.email,
                  }
                : null

            if (!objetivo) return null

            return (
              <li key={solicitud.id} className="border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={objetivo.href}
                    className="text-sm font-medium underline underline-offset-2"
                  >
                    {objetivo.titulo}
                  </Link>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {ESTADO_SOLICITUD_LABEL[solicitud.estado]}
                  </span>
                </div>

                {solicitud.mensaje && (
                  <p className="mt-2 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                    {solicitud.mensaje}
                  </p>
                )}

                {solicitud.estado === 'ACEPTADA' && (
                  <div className="mt-3 border border-acento bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                    <p className="font-medium text-acento">Contacto</p>
                    {objetivo.nombreContacto && <p>{objetivo.nombreContacto}</p>}
                    {objetivo.telefonoContacto && <p>{objetivo.telefonoContacto}</p>}
                    {objetivo.emailContacto && <p>{objetivo.emailContacto}</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}

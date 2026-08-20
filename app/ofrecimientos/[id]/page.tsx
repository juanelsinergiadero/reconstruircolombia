import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import {
  CATEGORIA_LABEL,
  TIPO_AYUDA_LABEL,
  ESTADO_OFRECIMIENTO_LABEL,
  respaldoLabel,
} from '@/lib/validations/ofrecimiento'
import { ESTADO_SOLICITUD_LABEL } from '@/lib/validations/solicitud'
import { ValidarBoton } from './validar-boton'
import { SolicitarBoton } from './solicitar-boton'
import { ResponderSolicitudBotones } from './responder-solicitud-botones'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ofrecimiento = await prisma.ofrecimiento.findUnique({
    where: { id },
    select: { descripcion: true },
  })
  return {
    title: ofrecimiento
      ? `${ofrecimiento.descripcion.slice(0, 60)} — reconstruircolombia`
      : 'Ofrecimiento no encontrado',
  }
}

export default async function OfrecimientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const usuario = await getAuthUser()

  // CRITICO: select explicito, igual que en el listado. Los campos de
  // contacto (contactoNombre, contactoTelefono, contactoEmail) son
  // sensibles y NUNCA salen de la base de datos hacia esta vista, aunque
  // sea a un usuario logueado. Mismo tratamiento que /necesidades/[id].
  const ofrecimiento = await prisma.ofrecimiento.findUnique({
    where: { id },
    select: {
      id: true,
      tipoAyuda: true,
      categoria: true,
      descripcion: true,
      capacidad: true,
      estado: true,
      createdAt: true,
      autorId: true,
      organizacion: { select: { nombre: true } },
      municipio: {
        select: {
          nombre: true,
          departamento: { select: { codigo: true, nombre: true } },
        },
      },
      _count: { select: { validaciones: true } },
    },
  })

  if (!ofrecimiento) {
    notFound()
  }

  const esAutor = usuario?.id === ofrecimiento.autorId

  // Salvaguarda (c) una validacion por usuario por ofrecimiento: se
  // consulta el mismo constraint unico que protege la escritura, para
  // decidir si mostrar el boton o el mensaje de "ya validaste".
  const yaValido =
    !esAutor && usuario
      ? Boolean(
          await prisma.validacion.findUnique({
            where: { validadorId_ofrecimientoId: { validadorId: usuario.id, ofrecimientoId: id } },
            select: { id: true },
          })
        )
      : false

  const respaldo = respaldoLabel(ofrecimiento._count.validaciones)

  // Canal de contacto mediado (Modelo B), bidireccional: aqui quien pide el
  // contacto es quien necesita esta ayuda; quien la ofrece decide si acepta.

  // Lado de quien pide el contacto: ¿ya tiene una solicitud para este
  // ofrecimiento? Determina si se muestra el boton o el estado de lo ya
  // enviado.
  const miSolicitud =
    !esAutor && usuario
      ? await prisma.solicitudContacto.findUnique({
          where: { solicitanteId_ofrecimientoId: { solicitanteId: usuario.id, ofrecimientoId: id } },
          select: { id: true, estado: true },
        })
      : null

  // Lado de quien ofrece: solicitudes recibidas. El contacto del
  // solicitante solo se revela aqui, y solo dentro de cada fila ya
  // ACEPTADA.
  const solicitudesRecibidas = esAutor
    ? await prisma.solicitudContacto.findMany({
        where: { ofrecimientoId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          estado: true,
          mensaje: true,
          createdAt: true,
          solicitante: {
            select: {
              nombre: true,
              email: true,
              telefono: true,
              organizacion: { select: { nombre: true } },
            },
          },
        },
      })
    : []

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-2xl">
        <Link
          href="/ofrecimientos"
          className="text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
        >
          Volver a ofrecimientos
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {TIPO_AYUDA_LABEL[ofrecimiento.tipoAyuda]}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {CATEGORIA_LABEL[ofrecimiento.categoria]}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {ESTADO_OFRECIMIENTO_LABEL[ofrecimiento.estado]}
          </span>
        </div>

        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {ofrecimiento.municipio.nombre}, {ofrecimiento.municipio.departamento.nombre}
          {ofrecimiento.organizacion && <> — {ofrecimiento.organizacion.nombre}</>}
        </p>

        {respaldo && (
          <p className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {respaldo}
          </p>
        )}

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {ofrecimiento.descripcion}
        </p>

        {ofrecimiento.capacidad && (
          <dl className="mt-6 text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Capacidad</dt>
            <dd className="font-medium">{ofrecimiento.capacidad}</dd>
          </dl>
        )}

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-medium">Validacion comunitaria</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Si conoces esta oferta de primera mano, puedes confirmarla. Esto
            suma confianza visible; nunca es requisito para que el
            ofrecimiento se publique.
          </p>

          <div className="mt-4">
            {esAutor && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Es tu ofrecimiento.</p>
            )}
            {!esAutor && yaValido && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ya validaste este ofrecimiento. Gracias.
              </p>
            )}
            {!esAutor && !yaValido && usuario && <ValidarBoton ofrecimientoId={ofrecimiento.id} />}
            {!esAutor && !usuario && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <Link
                  href={`/sign-in?callbackUrl=/ofrecimientos/${ofrecimiento.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  Inicia sesion
                </Link>{' '}
                para validar este ofrecimiento.
              </p>
            )}
          </div>
        </div>

        {!esAutor && (
          <div className="mt-6 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-medium">Necesitas esta ayuda?</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              El contacto no se comparte aqui. Si quien ofrece acepta tu
              solicitud, podras verlo dentro de la plataforma en{' '}
              <Link href="/mis-solicitudes" className="underline underline-offset-2">
                Mis solicitudes
              </Link>
              .
            </p>

            <div className="mt-4">
              {usuario && !miSolicitud && <SolicitarBoton ofrecimientoId={ofrecimiento.id} />}
              {usuario && miSolicitud && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {miSolicitud.estado === 'PENDIENTE' &&
                    'Ya enviaste tu solicitud. Esta pendiente de respuesta.'}
                  {miSolicitud.estado === 'ACEPTADA' && (
                    <>
                      Tu solicitud fue aceptada.{' '}
                      <Link href="/mis-solicitudes" className="font-medium underline underline-offset-2">
                        Ve el contacto en Mis solicitudes
                      </Link>
                      .
                    </>
                  )}
                  {miSolicitud.estado === 'RECHAZADA' && 'Tu solicitud fue rechazada.'}
                </p>
              )}
              {!usuario && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <Link
                    href={`/sign-in?callbackUrl=/ofrecimientos/${ofrecimiento.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    Inicia sesion
                  </Link>{' '}
                  para solicitar contacto con quien ofrece esta ayuda.
                </p>
              )}
            </div>
          </div>
        )}

        {esAutor && (
          <div className="mt-6 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-medium">Solicitudes de contacto recibidas</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Personas que necesitan tu ayuda. Si aceptas, podras ver como
              contactar a esa persona; ella vera como contactarte a ti.
            </p>

            {solicitudesRecibidas.length === 0 && (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Aun no has recibido solicitudes.
              </p>
            )}

            <ul className="mt-4 flex flex-col gap-4">
              {solicitudesRecibidas.map((solicitud) => (
                <li key={solicitud.id} className="border-t border-zinc-200 pt-4 first:border-t-0 first:pt-0 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {solicitud.solicitante.nombre ?? 'Alguien de la comunidad'}
                      {solicitud.solicitante.organizacion && (
                        <span className="font-normal text-zinc-500 dark:text-zinc-400">
                          {' '}
                          — {solicitud.solicitante.organizacion.nombre}
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {ESTADO_SOLICITUD_LABEL[solicitud.estado]}
                    </span>
                  </div>

                  {solicitud.mensaje && (
                    <p className="mt-1 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                      {solicitud.mensaje}
                    </p>
                  )}

                  {solicitud.estado === 'PENDIENTE' && (
                    <ResponderSolicitudBotones solicitudId={solicitud.id} />
                  )}

                  {solicitud.estado === 'ACEPTADA' && (
                    <div className="mt-2 border border-acento bg-white px-3 py-2 text-sm dark:bg-zinc-950">
                      <p className="font-medium text-acento">Contacto</p>
                      {solicitud.solicitante.email && <p>{solicitud.solicitante.email}</p>}
                      {solicitud.solicitante.telefono && <p>{solicitud.solicitante.telefono}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

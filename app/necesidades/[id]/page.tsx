import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import {
  CATEGORIA_LABEL,
  URGENCIA_LABEL,
  TIPO_REPORTE_LABEL,
  POBLACION_VULNERABLE_CAMPOS,
  respaldoLabel,
  type NecesidadInput,
} from '@/lib/validations/necesidad'
import { ESTADO_SOLICITUD_LABEL } from '@/lib/validations/solicitud'
import { ValidarBoton } from './validar-boton'
import { SolicitarBoton } from './solicitar-boton'
import { ResponderSolicitudBotones } from './responder-solicitud-botones'

const URGENCIA_COLOR: Record<NecesidadInput['urgencia'], string> = {
  BAJA: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  MEDIA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  ALTA: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  CRITICA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente de verificacion',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  RECHAZADA: 'Rechazada',
} as const

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const necesidad = await prisma.necesidad.findUnique({
    where: { id },
    select: { titulo: true },
  })
  return { title: necesidad ? `${necesidad.titulo} — reconstruircolombia` : 'Necesidad no encontrada' }
}

export default async function NecesidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const usuario = await getAuthUser()

  // CRITICO: select explicito, igual que en el listado. Los campos de
  // contacto (contactoNombre, contactoTelefono, contactoEmail) y
  // radicadoRud son sensibles y NUNCA salen de la base de datos hacia esta
  // vista, aunque sea a un usuario logueado (mostrarlos a logueados queda
  // modelado para despues, ver CLAUDE.md).
  const necesidad = await prisma.necesidad.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      categoria: true,
      urgencia: true,
      estado: true,
      numPersonas: true,
      tipoReporte: true,
      hayMenores: true,
      hayAdultosMayores: true,
      hayPersonasDiscapacidad: true,
      hayGestantes: true,
      hayEnfermosCronicos: true,
      createdAt: true,
      autorId: true,
      municipio: {
        select: {
          nombre: true,
          departamento: { select: { codigo: true, nombre: true } },
        },
      },
      _count: { select: { validaciones: true } },
    },
  })

  if (!necesidad) {
    notFound()
  }

  const esAutor = usuario?.id === necesidad.autorId

  // Salvaguarda (c) una validacion por usuario por necesidad: se consulta
  // el mismo constraint unico que protege la escritura, para decidir si
  // mostrar el boton o el mensaje de "ya validaste".
  const yaValido =
    !esAutor && usuario
      ? Boolean(
          await prisma.validacion.findUnique({
            where: { validadorId_necesidadId: { validadorId: usuario.id, necesidadId: id } },
            select: { id: true },
          })
        )
      : false

  const poblacionPresente = POBLACION_VULNERABLE_CAMPOS.filter(({ campo }) => necesidad[campo])
  const respaldo = respaldoLabel(necesidad._count.validaciones)

  // Canal de contacto mediado (Modelo B). Dos lados, cada uno con su
  // propia consulta para no traer datos sensibles que no le corresponden
  // a quien esta mirando.

  // Lado donante: ¿ya tiene una solicitud para esta necesidad? Determina si
  // se muestra el boton "Quiero ayudar" o el estado de lo que ya envio.
  const miSolicitud =
    !esAutor && usuario
      ? await prisma.solicitudContacto.findUnique({
          where: { solicitanteId_necesidadId: { solicitanteId: usuario.id, necesidadId: id } },
          select: { id: true, estado: true },
        })
      : null

  // Lado damnificado: solicitudes recibidas. El contacto del donante
  // (solicitante.email/telefono, su propia cuenta) solo se revela aqui, y
  // solo dentro de cada fila ya ACEPTADA.
  const solicitudesRecibidas = esAutor
    ? await prisma.solicitudContacto.findMany({
        where: { necesidadId: id },
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
          href="/necesidades"
          className="text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
        >
          Volver a necesidades
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${URGENCIA_COLOR[necesidad.urgencia]}`}>
            {URGENCIA_LABEL[necesidad.urgencia]}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {CATEGORIA_LABEL[necesidad.categoria]}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{ESTADO_LABEL[necesidad.estado]}</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{necesidad.titulo}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {necesidad.municipio.nombre}, {necesidad.municipio.departamento.nombre}
        </p>

        {respaldo && (
          <p className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {respaldo}
          </p>
        )}

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {necesidad.descripcion}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Personas afectadas</dt>
            <dd className="font-medium">{necesidad.numPersonas}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Quien reporta</dt>
            <dd className="font-medium">{TIPO_REPORTE_LABEL[necesidad.tipoReporte]}</dd>
          </div>
        </dl>

        {poblacionPresente.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium">Poblacion vulnerable</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {poblacionPresente.map(({ campo, etiqueta }) => (
                <li
                  key={campo}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {etiqueta}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-medium">Validacion comunitaria</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Si conoces esta situacion de primera mano, puedes confirmarla. Esto
            suma confianza visible; nunca es requisito para que la necesidad se
            atienda.
          </p>

          <div className="mt-4">
            {esAutor && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Es tu necesidad.</p>
            )}
            {!esAutor && yaValido && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ya validaste esta necesidad. Gracias.
              </p>
            )}
            {!esAutor && !yaValido && usuario && <ValidarBoton necesidadId={necesidad.id} />}
            {!esAutor && !usuario && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <Link
                  href={`/sign-in?callbackUrl=/necesidades/${necesidad.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  Inicia sesion
                </Link>{' '}
                para validar esta necesidad.
              </p>
            )}
          </div>
        </div>

        {!esAutor && (
          <div className="mt-6 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-medium">Quieres ayudar</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              El contacto no se comparte aqui. Si el autor acepta tu
              solicitud, podras verlo dentro de la plataforma en{' '}
              <Link href="/mis-solicitudes" className="underline underline-offset-2">
                Mis solicitudes
              </Link>
              .
            </p>

            <div className="mt-4">
              {usuario && !miSolicitud && <SolicitarBoton necesidadId={necesidad.id} />}
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
                    href={`/sign-in?callbackUrl=/necesidades/${necesidad.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    Inicia sesion
                  </Link>{' '}
                  para solicitar contacto y ayudar con esta necesidad.
                </p>
              )}
            </div>
          </div>
        )}

        {esAutor && (
          <div className="mt-6 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-medium">Solicitudes de contacto recibidas</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Personas que quieren ayudarte. Si aceptas, podras ver como
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

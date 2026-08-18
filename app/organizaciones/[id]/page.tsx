import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TIPO_ORGANIZACION_LABEL, ESTADO_ORGANIZACION_LABEL } from '@/lib/validations/organizacion'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const organizacion = await prisma.organizacion.findUnique({
    where: { id },
    select: { nombre: true },
  })
  return { title: organizacion ? `${organizacion.nombre} — reconstruircolombia` : 'Organizacion no encontrada' }
}

export default async function OrganizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // El contacto institucional SI es publico (no es dato de damnificado):
  // a diferencia de Necesidad, aqui puede ir en el select sin problema.
  const organizacion = await prisma.organizacion.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      estado: true,
      descripcion: true,
      contactoEmail: true,
      contactoTelefono: true,
      createdAt: true,
      municipio: {
        select: {
          nombre: true,
          departamento: { select: { codigo: true, nombre: true } },
        },
      },
    },
  })

  if (!organizacion) {
    notFound()
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-2xl">
        <Link
          href="/organizaciones"
          className="text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
        >
          Volver a organizaciones
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={
              organizacion.estado === 'VERIFICADA'
                ? 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }
          >
            {ESTADO_ORGANIZACION_LABEL[organizacion.estado]}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {TIPO_ORGANIZACION_LABEL[organizacion.tipo]}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{organizacion.nombre}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {organizacion.municipio.nombre}, {organizacion.municipio.departamento.nombre}
        </p>

        {organizacion.descripcion && (
          <p className="mt-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {organizacion.descripcion}
          </p>
        )}

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-medium">Contacto</h2>
          <div className="mt-2 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            {organizacion.contactoEmail && <span>{organizacion.contactoEmail}</span>}
            {organizacion.contactoTelefono && <span>{organizacion.contactoTelefono}</span>}
            {!organizacion.contactoEmail && !organizacion.contactoTelefono && (
              <span>Sin contacto publico registrado.</span>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

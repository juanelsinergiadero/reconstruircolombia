import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getDepartamentos, getMunicipiosPorDepartamento } from '@/lib/geo'
import {
  TIPOS_ORGANIZACION,
  ESTADOS_ORGANIZACION,
  TIPO_ORGANIZACION_LABEL,
  ESTADO_ORGANIZACION_LABEL,
  type OrganizacionInput,
} from '@/lib/validations/organizacion'

export const metadata = {
  title: 'Organizaciones — reconstruircolombia',
}

const ESTADO_COLOR: Record<(typeof ESTADOS_ORGANIZACION)[number], string> = {
  REGISTRADA: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  VERIFICADA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
}

// Solo digitos: 2 para departamento, 5 para municipio (codigo DIVIPOLA).
const esDepartamentoValido = (v: string) => /^\d{2}$/.test(v)
const esMunicipioValido = (v: string) => /^\d{5}$/.test(v)
const esTipoValido = (v: string): v is OrganizacionInput['tipo'] =>
  (TIPOS_ORGANIZACION as readonly string[]).includes(v)

export default async function OrganizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ departamento?: string; municipio?: string; tipo?: string }>
}) {
  const params = await searchParams

  const departamentoCodigo =
    params.departamento && esDepartamentoValido(params.departamento) ? params.departamento : undefined
  const municipioCodigo =
    params.municipio && esMunicipioValido(params.municipio) ? params.municipio : undefined
  const tipo = params.tipo && esTipoValido(params.tipo) ? params.tipo : undefined

  const [departamentos, municipios, organizaciones] = await Promise.all([
    getDepartamentos(),
    departamentoCodigo ? getMunicipiosPorDepartamento(departamentoCodigo) : Promise.resolve([]),
    prisma.organizacion.findMany({
      where: {
        ...(tipo ? { tipo } : {}),
        ...(municipioCodigo
          ? { municipioCodigo }
          : departamentoCodigo
            ? { municipio: { departamentoCodigo } }
            : {}),
      },
      // El contacto institucional SI es publico (no es dato de damnificado):
      // a diferencia de Necesidad, aqui puede ir en el select sin problema.
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
      orderBy: [{ estado: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  const hayFiltros = Boolean(departamentoCodigo || municipioCodigo || tipo)

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Organizaciones</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Instituciones, JAC, fundaciones y colectivos que respaldan la
              respuesta, filtrables por ubicacion y tipo.
            </p>
          </div>
          <Link
            href="/organizaciones/nueva"
            className="inline-flex shrink-0 items-center justify-center rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Registrar organizacion
          </Link>
        </div>

        <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="departamento" className="block text-sm font-medium">
              Departamento
            </label>
            <select
              id="departamento"
              name="departamento"
              defaultValue={departamentoCodigo ?? ''}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((d) => (
                <option key={d.codigo} value={d.codigo}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="municipio" className="block text-sm font-medium">
              Municipio
            </label>
            <select
              id="municipio"
              name="municipio"
              defaultValue={municipioCodigo ?? ''}
              disabled={!departamentoCodigo}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
            >
              <option value="">
                {departamentoCodigo ? 'Todos los municipios' : 'Elige un departamento primero'}
              </option>
              {municipios.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="tipo" className="block text-sm font-medium">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={tipo ?? ''}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_ORGANIZACION.map((t) => (
                <option key={t} value={t}>
                  {TIPO_ORGANIZACION_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Filtrar
            </button>
            {hayFiltros && (
              <Link
                href="/organizaciones"
                className="flex items-center text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>

        <ul className="mt-8 flex flex-col gap-4">
          {organizaciones.length === 0 && (
            <li className="rounded border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No hay organizaciones registradas para este filtro.
            </li>
          )}

          {organizaciones.map((o) => (
            <li key={o.id}>
              <Link
                href={`/organizaciones/${o.id}`}
                className="block rounded border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLOR[o.estado]}`}
                  >
                    {ESTADO_ORGANIZACION_LABEL[o.estado]}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {TIPO_ORGANIZACION_LABEL[o.tipo]}
                  </span>
                </div>

                <h2 className="mt-2 text-lg font-semibold">{o.nombre}</h2>
                {o.descripcion && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{o.descripcion}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>
                    {o.municipio.nombre}, {o.municipio.departamento.nombre}
                  </span>
                  {o.contactoEmail && <span>{o.contactoEmail}</span>}
                  {o.contactoTelefono && <span>{o.contactoTelefono}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

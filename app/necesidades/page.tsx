import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getDepartamentos, getMunicipiosPorDepartamento } from '@/lib/geo'
import { CATEGORIA_LABEL, URGENCIA_LABEL, type NecesidadInput } from '@/lib/validations/necesidad'

export const metadata = {
  title: 'Necesidades — reconstruircolombia',
}

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

// Solo digitos: 2 para departamento, 5 para municipio (codigo DIVIPOLA).
const esDepartamentoValido = (v: string) => /^\d{2}$/.test(v)
const esMunicipioValido = (v: string) => /^\d{5}$/.test(v)

function extracto(texto: string, maxLen = 160) {
  if (texto.length <= maxLen) return texto
  return texto.slice(0, maxLen).trimEnd() + '…'
}

export default async function NecesidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ departamento?: string; municipio?: string }>
}) {
  const params = await searchParams

  const departamentoCodigo =
    params.departamento && esDepartamentoValido(params.departamento) ? params.departamento : undefined
  const municipioCodigo =
    params.municipio && esMunicipioValido(params.municipio) ? params.municipio : undefined

  const [departamentos, municipios, necesidades] = await Promise.all([
    getDepartamentos(),
    departamentoCodigo ? getMunicipiosPorDepartamento(departamentoCodigo) : Promise.resolve([]),
    prisma.necesidad.findMany({
      where: municipioCodigo
        ? { municipioCodigo }
        : departamentoCodigo
          ? { municipio: { departamentoCodigo } }
          : {},
      // CRITICO: select explicito. Los campos de contacto
      // (contactoNombre, contactoTelefono, contactoEmail) son sensibles y
      // NUNCA deben salir de la base de datos hacia este listado publico.
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        categoria: true,
        urgencia: true,
        estado: true,
        numPersonas: true,
        createdAt: true,
        municipio: {
          select: {
            nombre: true,
            departamento: { select: { codigo: true, nombre: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const hayFiltros = Boolean(departamentoCodigo || municipioCodigo)

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Necesidades</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Necesidades reportadas por personas damnificadas, filtrables por ubicacion.
            </p>
          </div>
          <Link
            href="/necesidades/nueva"
            className="inline-flex shrink-0 items-center justify-center rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Registrar necesidad
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

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Filtrar
            </button>
            {hayFiltros && (
              <Link
                href="/necesidades"
                className="flex items-center text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>

        <ul className="mt-8 flex flex-col gap-4">
          {necesidades.length === 0 && (
            <li className="rounded border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No hay necesidades registradas para este filtro.
            </li>
          )}

          {necesidades.map((n) => (
            <li
              key={n.id}
              className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${URGENCIA_COLOR[n.urgencia]}`}
                >
                  {URGENCIA_LABEL[n.urgencia]}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {CATEGORIA_LABEL[n.categoria]}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ESTADO_LABEL[n.estado]}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-semibold">{n.titulo}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {extracto(n.descripcion)}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                <span>
                  {n.municipio.nombre}, {n.municipio.departamento.nombre}
                </span>
                <span>
                  {n.numPersonas} {n.numPersonas === 1 ? 'persona afectada' : 'personas afectadas'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

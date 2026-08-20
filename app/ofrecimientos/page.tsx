import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getDepartamentos, getMunicipiosPorDepartamento } from '@/lib/geo'
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  TIPOS_AYUDA,
  TIPO_AYUDA_LABEL,
  ESTADO_OFRECIMIENTO_LABEL,
  respaldoLabel,
} from '@/lib/validations/ofrecimiento'

export const metadata = {
  title: 'Ofrecimientos — reconstruircolombia',
}

// Solo digitos: 2 para departamento, 5 para municipio (codigo DIVIPOLA).
const esDepartamentoValido = (v: string) => /^\d{2}$/.test(v)
const esMunicipioValido = (v: string) => /^\d{5}$/.test(v)
const esCategoriaValida = (v: string): v is (typeof CATEGORIAS)[number] =>
  (CATEGORIAS as readonly string[]).includes(v)
const esTipoAyudaValido = (v: string): v is (typeof TIPOS_AYUDA)[number] =>
  (TIPOS_AYUDA as readonly string[]).includes(v)

function extracto(texto: string, maxLen = 160) {
  if (texto.length <= maxLen) return texto
  return texto.slice(0, maxLen).trimEnd() + '…'
}

export default async function OfrecimientosPage({
  searchParams,
}: {
  searchParams: Promise<{
    departamento?: string
    municipio?: string
    categoria?: string
    tipoAyuda?: string
  }>
}) {
  const params = await searchParams

  const departamentoCodigo =
    params.departamento && esDepartamentoValido(params.departamento) ? params.departamento : undefined
  const municipioCodigo =
    params.municipio && esMunicipioValido(params.municipio) ? params.municipio : undefined
  const categoria =
    params.categoria && esCategoriaValida(params.categoria) ? params.categoria : undefined
  const tipoAyuda =
    params.tipoAyuda && esTipoAyudaValido(params.tipoAyuda) ? params.tipoAyuda : undefined

  const [departamentos, municipios, ofrecimientos] = await Promise.all([
    getDepartamentos(),
    departamentoCodigo ? getMunicipiosPorDepartamento(departamentoCodigo) : Promise.resolve([]),
    prisma.ofrecimiento.findMany({
      where: {
        ...(municipioCodigo
          ? { municipioCodigo }
          : departamentoCodigo
            ? { municipio: { departamentoCodigo } }
            : {}),
        ...(categoria ? { categoria } : {}),
        ...(tipoAyuda ? { tipoAyuda } : {}),
      },
      // CRITICO: select explicito. Los campos de contacto (contactoNombre,
      // contactoTelefono, contactoEmail) son sensibles y NUNCA deben salir
      // de la base de datos hacia este listado publico. Mismo tratamiento
      // que /necesidades.
      select: {
        id: true,
        tipoAyuda: true,
        categoria: true,
        descripcion: true,
        capacidad: true,
        estado: true,
        createdAt: true,
        municipio: {
          select: {
            nombre: true,
            departamento: { select: { codigo: true, nombre: true } },
          },
        },
        _count: { select: { validaciones: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const hayFiltros = Boolean(departamentoCodigo || municipioCodigo || categoria || tipoAyuda)

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ofrecimientos</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Ayuda ofrecida por personas y organizaciones, filtrable por ubicacion.
            </p>
          </div>
          <Link
            href="/ofrecimientos/nuevo"
            className="inline-flex shrink-0 items-center justify-center rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Ofrece tu ayuda
          </Link>
        </div>

        <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 sm:min-w-[10rem]">
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

          <div className="flex-1 sm:min-w-[10rem]">
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

          <div className="flex-1 sm:min-w-[10rem]">
            <label htmlFor="categoria" className="block text-sm font-medium">
              Categoria
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={categoria ?? ''}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Todas las categorias</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 sm:min-w-[10rem]">
            <label htmlFor="tipoAyuda" className="block text-sm font-medium">
              Tipo de ayuda
            </label>
            <select
              id="tipoAyuda"
              name="tipoAyuda"
              defaultValue={tipoAyuda ?? ''}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_AYUDA.map((t) => (
                <option key={t} value={t}>
                  {TIPO_AYUDA_LABEL[t]}
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
                href="/ofrecimientos"
                className="flex items-center text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>

        <ul className="mt-8 flex flex-col gap-4">
          {ofrecimientos.length === 0 && (
            <li className="rounded border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No hay ofrecimientos registrados para este filtro.
            </li>
          )}

          {ofrecimientos.map((o) => {
            const respaldo = respaldoLabel(o._count.validaciones)
            return (
              <li key={o.id}>
                <Link
                  href={`/ofrecimientos/${o.id}`}
                  className="block rounded border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {TIPO_AYUDA_LABEL[o.tipoAyuda]}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {CATEGORIA_LABEL[o.categoria]}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {ESTADO_OFRECIMIENTO_LABEL[o.estado]}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {extracto(o.descripcion)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>
                      {o.municipio.nombre}, {o.municipio.departamento.nombre}
                    </span>
                    {o.capacidad && <span>{o.capacidad}</span>}
                    {respaldo && <span className="font-medium text-blue-700 dark:text-blue-400">{respaldo}</span>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}

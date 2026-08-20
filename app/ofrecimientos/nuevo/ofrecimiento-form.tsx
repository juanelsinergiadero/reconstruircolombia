'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  TIPOS_AYUDA,
  TIPO_AYUDA_LABEL,
} from '@/lib/validations/ofrecimiento'
import { crearOfrecimiento, obtenerMunicipios, type CrearOfrecimientoState } from './actions'

type Departamento = { codigo: string; nombre: string }
type Municipio = { codigo: string; nombre: string; slug: string }

const ESTADO_INICIAL: CrearOfrecimientoState = { ok: false }

// text-base (no text-sm) en los inputs: en iOS, un input con font-size menor
// a 16px hace zoom automatico al enfocar. py-3 para un tap target comodo.
const CAMPO_CLASE =
  'mt-1 w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900'

function Errores({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{mensajes[0]}</p>
  )
}

export function OfrecimientoForm({
  departamentos,
  defaultContactoNombre,
  defaultContactoEmail,
}: {
  departamentos: Departamento[]
  defaultContactoNombre?: string
  defaultContactoEmail?: string
}) {
  const [state, formAction, isPending] = useActionState(crearOfrecimiento, ESTADO_INICIAL)
  const [departamentoCodigo, setDepartamentoCodigo] = useState('')
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [isPendingMunicipios, startMunicipiosTransition] = useTransition()
  const [tipoAyuda, setTipoAyuda] = useState<(typeof TIPOS_AYUDA)[number]>('MATERIAL')

  function handleDepartamentoChange(codigo: string) {
    setDepartamentoCodigo(codigo)
    setMunicipios([])
    if (!codigo) return
    startMunicipiosTransition(async () => {
      const lista = await obtenerMunicipios(codigo)
      setMunicipios(lista)
    })
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.mensaje && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.mensaje}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-medium">Que tipo de ayuda ofreces?</legend>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          {TIPOS_AYUDA.map((t) => (
            <label
              key={t}
              className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                tipoAyuda === t
                  ? 'border-foreground bg-zinc-100 dark:bg-zinc-900'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="tipoAyuda"
                value={t}
                checked={tipoAyuda === t}
                onChange={() => setTipoAyuda(t)}
                className="h-4 w-4 shrink-0"
              />
              {TIPO_AYUDA_LABEL[t]}
            </label>
          ))}
        </div>
        <Errores mensajes={state.errores?.tipoAyuda} />
      </fieldset>

      <div>
        <label htmlFor="categoria" className="block text-sm font-medium">
          Categoria
        </label>
        <select
          id="categoria"
          name="categoria"
          required
          defaultValue=""
          className={CAMPO_CLASE}
        >
          <option value="" disabled>
            Selecciona una categoria
          </option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABEL[c]}
            </option>
          ))}
        </select>
        <Errores mensajes={state.errores?.categoria} />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium">
          Descripcion
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          required
          minLength={15}
          maxLength={2000}
          rows={4}
          placeholder="Describe con el mayor detalle posible que puedes ofrecer"
          className={CAMPO_CLASE}
        />
        <Errores mensajes={state.errores?.descripcion} />
      </div>

      <div>
        <label htmlFor="capacidad" className="block text-sm font-medium">
          Capacidad (opcional)
        </label>
        <input
          id="capacidad"
          name="capacidad"
          type="text"
          maxLength={200}
          placeholder='Ej: "20 kits de aseo" o "3 dias por semana"'
          className={CAMPO_CLASE}
        />
        <Errores mensajes={state.errores?.capacidad} />
      </div>

      <div>
        <label htmlFor="departamento" className="block text-sm font-medium">
          Departamento
        </label>
        <select
          id="departamento"
          value={departamentoCodigo}
          onChange={(e) => handleDepartamentoChange(e.target.value)}
          className={CAMPO_CLASE}
        >
          <option value="">Selecciona un departamento</option>
          {departamentos.map((d) => (
            <option key={d.codigo} value={d.codigo}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="municipioCodigo" className="block text-sm font-medium">
          Municipio
        </label>
        <select
          id="municipioCodigo"
          name="municipioCodigo"
          required
          defaultValue=""
          disabled={!departamentoCodigo || isPendingMunicipios}
          className={`${CAMPO_CLASE} disabled:bg-zinc-100 dark:disabled:bg-zinc-800`}
        >
          <option value="" disabled>
            {isPendingMunicipios ? 'Cargando municipios...' : 'Selecciona un municipio'}
          </option>
          {municipios.map((m) => (
            <option key={m.codigo} value={m.codigo}>
              {m.nombre}
            </option>
          ))}
        </select>
        <Errores mensajes={state.errores?.municipioCodigo} />
      </div>

      <fieldset className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
        <legend className="px-1 text-sm font-medium">
          Contacto (privado, no se muestra en el listado publico)
        </legend>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Deja al menos un telefono o correo para que puedan contactarte.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="contactoNombre" className="block text-sm font-medium">
              Nombre de contacto
            </label>
            <input
              id="contactoNombre"
              name="contactoNombre"
              type="text"
              maxLength={120}
              defaultValue={defaultContactoNombre}
              className={CAMPO_CLASE}
            />
            <Errores mensajes={state.errores?.contactoNombre} />
          </div>

          <div>
            <label htmlFor="contactoTelefono" className="block text-sm font-medium">
              Telefono
            </label>
            <input
              id="contactoTelefono"
              name="contactoTelefono"
              type="tel"
              inputMode="tel"
              maxLength={30}
              className={CAMPO_CLASE}
            />
            <Errores mensajes={state.errores?.contactoTelefono} />
          </div>

          <div>
            <label htmlFor="contactoEmail" className="block text-sm font-medium">
              Correo
            </label>
            <input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              inputMode="email"
              defaultValue={defaultContactoEmail}
              className={CAMPO_CLASE}
            />
            <Errores mensajes={state.errores?.contactoEmail} />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-foreground px-5 py-4 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? 'Guardando...' : 'Ofrece tu ayuda'}
      </button>
    </form>
  )
}

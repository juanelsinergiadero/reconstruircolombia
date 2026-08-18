'use client'

import { useActionState, useState, useTransition } from 'react'
import { CATEGORIAS, URGENCIAS } from '@/lib/validations/necesidad'
import { crearNecesidad, obtenerMunicipios, type CrearNecesidadState } from './actions'

type Departamento = { codigo: string; nombre: string }
type Municipio = { codigo: string; nombre: string; slug: string }

const CATEGORIA_LABEL: Record<(typeof CATEGORIAS)[number], string> = {
  AGUA: 'Agua',
  ALIMENTOS: 'Alimentos',
  SALUD: 'Salud',
  REFUGIO: 'Refugio / alojamiento',
  ROPA: 'Ropa',
  HIGIENE: 'Higiene',
  RESCATE: 'Rescate',
  OTRO: 'Otro',
}

const URGENCIA_LABEL: Record<(typeof URGENCIAS)[number], string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
}

const ESTADO_INICIAL: CrearNecesidadState = { ok: false }

function Errores({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{mensajes[0]}</p>
  )
}

export function NecesidadForm({
  departamentos,
  defaultContactoNombre,
  defaultContactoEmail,
}: {
  departamentos: Departamento[]
  defaultContactoNombre?: string
  defaultContactoEmail?: string
}) {
  const [state, formAction, isPending] = useActionState(crearNecesidad, ESTADO_INICIAL)
  const [departamentoCodigo, setDepartamentoCodigo] = useState('')
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [isPendingMunicipios, startMunicipiosTransition] = useTransition()

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

      <div>
        <label htmlFor="titulo" className="block text-sm font-medium">
          Titulo
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          minLength={5}
          maxLength={120}
          placeholder="Ej: Familia sin agua potable en zona rural"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Errores mensajes={state.errores?.titulo} />
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
          placeholder="Describe la situacion con el mayor detalle posible"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Errores mensajes={state.errores?.descripcion} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            defaultValue=""
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
          <label htmlFor="urgencia" className="block text-sm font-medium">
            Urgencia
          </label>
          <select
            id="urgencia"
            name="urgencia"
            required
            defaultValue="MEDIA"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {URGENCIAS.map((u) => (
              <option key={u} value={u}>
                {URGENCIA_LABEL[u]}
              </option>
            ))}
          </select>
          <Errores mensajes={state.errores?.urgencia} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="departamento" className="block text-sm font-medium">
            Departamento
          </label>
          <select
            id="departamento"
            value={departamentoCodigo}
            onChange={(e) => handleDepartamentoChange(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
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
      </div>

      <div>
        <label htmlFor="numPersonas" className="block text-sm font-medium">
          Numero de personas afectadas
        </label>
        <input
          id="numPersonas"
          name="numPersonas"
          type="number"
          required
          min={1}
          max={10000}
          defaultValue={1}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 sm:w-40"
        />
        <Errores mensajes={state.errores?.numPersonas} />
      </div>

      <fieldset className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
        <legend className="px-1 text-sm font-medium">
          Contacto (privado, no se muestra en el listado publico)
        </legend>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Deja al menos un medio de contacto para que la ayuda pueda llegar.
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
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Errores mensajes={state.errores?.contactoNombre} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactoTelefono" className="block text-sm font-medium">
                Telefono
              </label>
              <input
                id="contactoTelefono"
                name="contactoTelefono"
                type="tel"
                maxLength={30}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
                defaultValue={defaultContactoEmail}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <Errores mensajes={state.errores?.contactoEmail} />
            </div>
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? 'Guardando...' : 'Registrar necesidad'}
      </button>
    </form>
  )
}

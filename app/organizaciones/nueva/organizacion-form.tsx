'use client'

import { useActionState, useState, useTransition } from 'react'
import { TIPOS_ORGANIZACION, TIPO_ORGANIZACION_LABEL } from '@/lib/validations/organizacion'
import { crearOrganizacion, obtenerMunicipios, type CrearOrganizacionState } from './actions'

type Departamento = { codigo: string; nombre: string }
type Municipio = { codigo: string; nombre: string; slug: string }

const ESTADO_INICIAL: CrearOrganizacionState = { ok: false }

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

export function OrganizacionForm({ departamentos }: { departamentos: Departamento[] }) {
  const [state, formAction, isPending] = useActionState(crearOrganizacion, ESTADO_INICIAL)
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
        <label htmlFor="nombre" className="block text-sm font-medium">
          Nombre de la organizacion
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          minLength={3}
          maxLength={150}
          placeholder="Ej: Junta de Accion Comunal Vereda El Palmar"
          className={CAMPO_CLASE}
        />
        <Errores mensajes={state.errores?.nombre} />
      </div>

      <div>
        <label htmlFor="tipo" className="block text-sm font-medium">
          Tipo de organizacion
        </label>
        <select id="tipo" name="tipo" required defaultValue="" className={CAMPO_CLASE}>
          <option value="" disabled>
            Selecciona un tipo
          </option>
          {TIPOS_ORGANIZACION.map((t) => (
            <option key={t} value={t}>
              {TIPO_ORGANIZACION_LABEL[t]}
            </option>
          ))}
        </select>
        <Errores mensajes={state.errores?.tipo} />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium">
          Descripcion (opcional)
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          maxLength={1000}
          rows={4}
          placeholder="Que hace la organizacion y como ayuda"
          className={CAMPO_CLASE}
        />
        <Errores mensajes={state.errores?.descripcion} />
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
          Municipio sede
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
        <legend className="px-1 text-sm font-medium">Contacto institucional (publico)</legend>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Este contacto SI se muestra en el listado publico, para que donantes
          y voluntarios puedan llegar a la organizacion. Deja al menos uno.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="contactoEmail" className="block text-sm font-medium">
              Correo
            </label>
            <input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              inputMode="email"
              className={CAMPO_CLASE}
            />
            <Errores mensajes={state.errores?.contactoEmail} />
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
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-foreground px-5 py-4 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? 'Guardando...' : 'Registrar organizacion'}
      </button>
    </form>
  )
}

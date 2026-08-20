'use client'

import { useActionState } from 'react'
import { solicitarContactoOfrecimiento, type SolicitarContactoState } from './solicitar-actions'

const ESTADO_INICIAL: SolicitarContactoState = { ok: false }

// Boton + mensaje opcional para pedir que quien ofrece la ayuda habilite el
// contacto. Solo se renderiza cuando el servidor ya determino que la
// persona puede solicitar (logueada, no autora, sin solicitud previa para
// este ofrecimiento).
export function SolicitarBoton({ ofrecimientoId }: { ofrecimientoId: string }) {
  const [state, formAction, isPending] = useActionState(solicitarContactoOfrecimiento, ESTADO_INICIAL)

  if (state.ok) {
    return (
      <p className="border border-acento bg-white px-4 py-3 text-sm text-acento">
        {state.mensaje}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="ofrecimientoId" value={ofrecimientoId} />
      <div>
        <label htmlFor="mensaje" className="text-sm font-medium text-zinc-900">
          Mensaje (opcional)
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={3}
          maxLength={500}
          placeholder="Cuenta que necesitas..."
          className="mt-1 w-full border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-acento focus:outline-none"
        />
      </div>
      {state.mensaje && <p className="text-sm text-red-600">{state.mensaje}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="border border-acento px-5 py-3 text-base font-medium text-acento transition-colors hover:bg-acento hover:text-white disabled:opacity-60"
      >
        {isPending ? 'Enviando...' : 'Quiero esta ayuda'}
      </button>
    </form>
  )
}

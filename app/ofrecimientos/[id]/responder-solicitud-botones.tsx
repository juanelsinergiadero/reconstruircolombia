'use client'

import { useActionState } from 'react'
import { responderSolicitudOfrecimiento, type ResponderSolicitudState } from './solicitar-actions'

const ESTADO_INICIAL: ResponderSolicitudState = { ok: false }

// Aceptar/rechazar una solicitud de contacto recibida. Solo se renderiza
// para el autor del ofrecimiento, en solicitudes aun PENDIENTES: una vez
// respondida, la pagina se revalida y este componente deja de mostrarse
// (el padre pinta el nuevo estado, incluido el contacto si fue ACEPTADA).
export function ResponderSolicitudBotones({ solicitudId }: { solicitudId: string }) {
  const [state, formAction, isPending] = useActionState(responderSolicitudOfrecimiento, ESTADO_INICIAL)

  if (state.ok) {
    return <p className="text-sm text-acento">{state.mensaje}</p>
  }

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="solicitudId" value={solicitudId} />
      {state.mensaje && <p className="w-full text-sm text-red-600">{state.mensaje}</p>}
      <button
        type="submit"
        name="decision"
        value="ACEPTADA"
        disabled={isPending}
        className="border border-acento px-4 py-2 text-sm font-medium text-acento transition-colors hover:bg-acento hover:text-white disabled:opacity-60"
      >
        Aceptar
      </button>
      <button
        type="submit"
        name="decision"
        value="RECHAZADA"
        disabled={isPending}
        className="border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60"
      >
        Rechazar
      </button>
    </form>
  )
}

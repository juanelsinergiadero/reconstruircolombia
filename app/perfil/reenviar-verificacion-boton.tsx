'use client'

import { useActionState } from 'react'
import { reenviarVerificacion, type ReenviarVerificacionState } from './actions'

const ESTADO_INICIAL: ReenviarVerificacionState = { ok: false }

export function ReenviarVerificacionBoton() {
  const [state, formAction, isPending] = useActionState(reenviarVerificacion, ESTADO_INICIAL)

  if (state.ok && state.mensaje) {
    return <p className="text-sm text-acento">{state.mensaje}</p>
  }

  return (
    <form action={formAction}>
      {state.mensaje && <p className="mb-2 text-sm text-red-600">{state.mensaje}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="border border-acento px-4 py-2 text-sm font-medium text-acento transition-colors hover:bg-acento hover:text-white disabled:opacity-60"
      >
        {isPending ? 'Enviando...' : 'Reenviar correo de verificacion'}
      </button>
    </form>
  )
}

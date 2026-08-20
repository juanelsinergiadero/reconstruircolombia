'use client'

import { useActionState } from 'react'
import { validarOfrecimiento, type ValidarState } from './validar-actions'

const ESTADO_INICIAL: ValidarState = { ok: false }

// El boton de validar solo se renderiza cuando el servidor ya determino que
// la persona puede validar (logueada, no autora, sin validacion previa).
// El propio constraint unico en la base de datos es la garantia real contra
// dobles validaciones; este componente solo traduce su resultado a UI.
export function ValidarBoton({ ofrecimientoId }: { ofrecimientoId: string }) {
  const [state, formAction, isPending] = useActionState(validarOfrecimiento, ESTADO_INICIAL)

  if (state.ok) {
    return (
      <p className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        {state.mensaje}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="ofrecimientoId" value={ofrecimientoId} />
      {state.mensaje && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.mensaje}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-foreground px-5 py-3 text-base font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:hover:bg-zinc-900"
      >
        {isPending ? 'Enviando...' : 'Me consta que esto es real'}
      </button>
    </form>
  )
}

'use client'

import { useActionState, useEffect, useRef } from 'react'
import { verificarEmailToken, type VerificarState } from './verificar-actions'

const ESTADO_INICIAL: VerificarState = { ok: false }

// Confirma el token automaticamente al cargar la pagina (un solo POST via
// Server Action, no una mutacion en el GET del enlace en si — asi un
// prefetch/escaneo del correo no consume el token por accidente).
export function VerificarBoton({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(verificarEmailToken, ESTADO_INICIAL)
  const enviado = useRef(false)

  useEffect(() => {
    if (enviado.current) return
    enviado.current = true
    const formData = new FormData()
    formData.set('token', token)
    formAction(formData)
  }, [token, formAction])

  if (isPending || (!state.ok && !state.mensaje)) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Verificando tu correo...</p>
  }

  return (
    <p
      className={
        state.ok
          ? 'border border-acento bg-white px-4 py-3 text-sm text-acento'
          : 'text-sm text-red-600'
      }
    >
      {state.mensaje}
    </p>
  )
}

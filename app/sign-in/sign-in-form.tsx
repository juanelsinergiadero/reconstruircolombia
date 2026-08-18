'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { iniciarSesion, type IniciarSesionState } from './actions'

const ESTADO_INICIAL: IniciarSesionState = { ok: false }

function Errores({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{mensajes[0]}</p>
}

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(iniciarSesion, ESTADO_INICIAL)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.mensaje && (
        <p className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.mensaje}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Errores mensajes={state.errores?.email} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Contrasena
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Errores mensajes={state.errores?.password} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? 'Ingresando...' : 'Iniciar sesion'}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No tienes cuenta?{' '}
        <Link href="/registro" className="font-medium underline underline-offset-2">
          Registrate
        </Link>
      </p>
    </form>
  )
}

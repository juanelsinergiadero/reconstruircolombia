'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registrarUsuario, type RegistroState } from './actions'

const ESTADO_INICIAL: RegistroState = { ok: false }

function Errores({ mensajes }: { mensajes?: string[] }) {
  if (!mensajes?.length) return null
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{mensajes[0]}</p>
}

export function RegistroForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(registrarUsuario, ESTADO_INICIAL)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.mensaje && (
        <p
          className={
            state.ok
              ? 'rounded border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
              : 'rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
          }
        >
          {state.mensaje}
        </p>
      )}

      {state.ok ? (
        <Link
          href="/sign-in"
          className="rounded bg-foreground px-5 py-3 text-center font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Ir a iniciar sesion
        </Link>
      ) : (
        <>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Errores mensajes={state.errores?.nombre} />
          </div>

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
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Errores mensajes={state.errores?.password} />
          </div>

          <div>
            <label htmlFor="confirmarPassword" className="block text-sm font-medium">
              Confirmar contrasena
            </label>
            <input
              id="confirmarPassword"
              name="confirmarPassword"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Errores mensajes={state.errores?.confirmarPassword} />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Ya tienes cuenta?{' '}
            <Link href="/sign-in" className="font-medium underline underline-offset-2">
              Inicia sesion
            </Link>
          </p>
        </>
      )}
    </form>
  )
}

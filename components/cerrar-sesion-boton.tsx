'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

export function CerrarSesionBoton() {
  const [saliendo, setSaliendo] = useState(false)

  return (
    <button
      type="button"
      disabled={saliendo}
      onClick={() => {
        setSaliendo(true)
        signOut({ callbackUrl: '/' })
      }}
      className="border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-60"
    >
      {saliendo ? 'Saliendo...' : 'Cerrar sesion'}
    </button>
  )
}

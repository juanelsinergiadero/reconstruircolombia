'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Boton flotante presente en todo el sitio (ver app/layout.tsx). Enlaza a
// /asistente en vez de abrir un panel embebido: reutiliza la pagina completa
// (con su aviso permanente de IA en prueba + Linea 123, ver asistente-chat.tsx)
// en lugar de duplicar la logica de chat/streaming en dos lugares. Se oculta
// en /asistente mismo para no superponerse al formulario de esa pagina.
export function AsistenteBotonFlotante() {
  const pathname = usePathname()
  if (pathname === '/asistente') return null

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5 sm:bottom-6 sm:right-6">
      <span className="border border-acento bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-acento shadow-sm">
        IA en prueba
      </span>
      <Link
        href="/asistente"
        aria-label="Abrir asistente virtual (inteligencia artificial en fase de prueba)"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-acento bg-acento text-white shadow-lg transition-colors hover:bg-acento-oscuro sm:h-14 sm:w-14"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 stroke-white"
          fill="none"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-4.5A8 8 0 1 1 21 12Z" />
        </svg>
      </Link>
    </div>
  )
}

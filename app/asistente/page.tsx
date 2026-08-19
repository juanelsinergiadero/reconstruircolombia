import type { Metadata } from 'next'
import { AsistenteChat } from './asistente-chat'

// Ruta deliberadamente NO enlazada desde el header, la landing ni ningun
// otro lugar visible (ver components/header.tsx: no aparece en NAV_LINKS).
// Se prueba solo por URL directa antes de publicarla. robots noindex/nofollow
// es una capa extra para que no quede indexada mientras tanto.
export const metadata: Metadata = {
  title: 'Asistente — reconstruircolombia',
  robots: { index: false, follow: false },
}

export default function AsistentePage() {
  return (
    <main className="flex flex-1 flex-col bg-white text-zinc-900">
      <AsistenteChat />
    </main>
  )
}

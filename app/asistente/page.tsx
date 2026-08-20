import type { Metadata } from 'next'
import { AsistenteChat } from './asistente-chat'

// Se llega aca por el enlace discreto del footer o el boton flotante del
// layout (components/asistente-boton-flotante.tsx), no desde el header ni
// la landing: sigue en fase de prueba. robots noindex/nofollow evita que
// quede indexada mientras tanto.
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

import Link from 'next/link'

// Landing editorial: fondo blanco fijo (identidad de marca, no sigue el
// prefers-color-scheme del resto del sitio), un solo acento terracota,
// sin tarjetas ni sombras. Mobile-first: se disena primero para ~375px.

const PASOS = [
  {
    numero: '01',
    titulo: 'Se cuenta la necesidad',
    texto:
      'Una persona afectada — o alguien en su nombre — describe que necesita y donde. Sin tramites ni barreras: cinco minutos desde el celular.',
  },
  {
    numero: '02',
    titulo: 'La comunidad la respalda',
    texto:
      'Vecinos, juntas de accion comunal, fundaciones y colectivos que conocen la situacion de cerca la validan. Eso suma confianza; nunca es un requisito para pedir ayuda.',
  },
  {
    numero: '03',
    titulo: 'La ayuda llega directo',
    texto:
      'Voluntarios, organizaciones y quien pueda dar una mano ven necesidades reales, ubicadas y respaldadas por la comunidad — y responden sin intermediarios.',
  },
] as const

export default function LandingPage() {
  return (
    <main className="flex-1 bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        <header className="pt-10 sm:pt-14">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-900">
            reconstruircolombia
          </span>
        </header>

        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-acento">
            Respuesta al terremoto del 10 de agosto
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            Reconstruir es cosa de <span className="text-acento">todos</span>.
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
            reconstruircolombia conecta lo que necesitan las personas
            afectadas por el sismo con la ayuda que la comunidad puede dar.
            Nada de fondos ni recolectas: informacion real, ubicada y
            verificada por quienes estan cerca.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/necesidades"
              className="flex items-center justify-center bg-acento px-8 py-4 text-base font-medium text-white transition-colors hover:bg-acento-oscuro sm:w-auto"
            >
              Ver necesidades
            </Link>
            <Link
              href="/necesidades/nueva"
              className="flex items-center justify-center border border-zinc-900 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white sm:w-auto"
            >
              Registrar una necesidad
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-200 py-16 sm:py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Como funciona
          </h2>

          <ol className="mt-8 divide-y divide-zinc-200 border-b border-zinc-200">
            {PASOS.map((paso) => (
              <li key={paso.numero} className="py-10 sm:flex sm:items-baseline sm:gap-10 sm:py-12">
                <span className="block text-3xl font-bold text-acento sm:w-16 sm:shrink-0 sm:text-4xl">
                  {paso.numero}
                </span>
                <div className="mt-3 sm:mt-0">
                  <h3 className="text-xl font-semibold sm:text-2xl">{paso.titulo}</h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
                    {paso.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-zinc-200 py-12 sm:py-16">
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
            Respuesta al terremoto del 10 de agosto de 2026 (Mw 7.4), con
            epicentro en San Jose del Palmar, Choco. Plataforma humanitaria
            de codigo abierto.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Representas una institucion educativa, JAC, fundacion o
            colectivo?{' '}
            <Link href="/organizaciones/nueva" className="font-medium text-zinc-900 underline underline-offset-2">
              Registra tu organizacion
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

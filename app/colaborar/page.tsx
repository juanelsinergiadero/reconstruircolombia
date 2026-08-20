import Link from 'next/link'

// Mismo lenguaje visual editorial de la landing principal (app/page.tsx):
// fondo blanco fijo, un solo acento terracota, sin rounded/shadow, mobile-first.
// Publica en middleware.ts (publicRoutes) porque no requiere identidad: cualquier
// desarrollador, organizacion o persona interesada puede leerla sin cuenta.

export const metadata = {
  title: 'Colaborar — reconstruircolombia',
  description:
    'reconstruircolombia es una plataforma humanitaria de codigo abierto. Conoce como sumarte: con codigo, como organizacion, o con otras habilidades.',
}

const REPO_URL = 'https://github.com/juanelsinergiadero/reconstruircolombia'

const STACK = [
  { categoria: 'Framework', detalle: 'Next.js 15 (App Router) + React 19' },
  { categoria: 'Lenguaje', detalle: 'TypeScript estricto en todo el codigo' },
  { categoria: 'Base de datos', detalle: 'PostgreSQL con Prisma como ORM' },
  { categoria: 'Busqueda semantica', detalle: 'pgvector, para el modulo de IA' },
  { categoria: 'Estilos', detalle: 'Tailwind CSS v4' },
  { categoria: 'Autenticacion', detalle: 'NextAuth v5 (credenciales + sesion JWT)' },
] as const

const FORMAS = [
  {
    titulo: 'Con codigo',
    texto:
      'Revisa los issues abiertos, propone mejoras o resuelve bugs. Cada Pull Request pasa por revision antes de integrarse. El README y CONTRIBUTING.md te llevan de cero a un entorno local funcionando.',
  },
  {
    titulo: 'Como organizacion',
    texto:
      'Si representas una institucion educativa, Junta de Accion Comunal, fundacion o colectivo, puedes registrar tu organizacion en la plataforma y respaldar con tu presencia institucional las necesidades que conoces de cerca.',
  },
  {
    titulo: 'Con otras habilidades',
    texto:
      'Diseño, traduccion a otras lenguas, revision de textos, o simplemente contarle a alguien mas que esto existe. La plataforma solo sirve si la comunidad que necesita ayuda y la que puede darla se enteran de que esta aqui.',
  },
  {
    titulo: 'Con conocimiento tecnico en construccion',
    texto:
      'El asistente de orientacion se apoya en manuales tecnicos sobre rehabilitacion de vivienda en bahareque, tapia pisada y mamposteria. Si tienes formacion en ingenieria sismica o construccion tradicional, tu criterio puede mejorar esa base.',
  },
] as const

export default function ColaborarPage() {
  return (
    <main className="flex-1 bg-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-acento">
            Colaborar
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Esto no lo construye <span className="text-acento">una sola persona</span>.
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-600 sm:text-xl">
            reconstruircolombia nacio como respuesta al terremoto del 10 de
            agosto de 2026 (Mw 7.4, epicentro San Jose del Palmar, Choco), para
            conectar lo que necesitan las personas damnificadas con la ayuda
            que la comunidad puede dar. Es un proyecto de bien publico, sin
            animo de lucro, impulsado por El Sinergiadero — y esta abierto
            para que la comunidad lo construya y lo sostenga.
          </p>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
            Si sabes programar, diriges una organizacion, sabes de
            construccion sismo-resistente, o simplemente quieres que esto
            llegue a mas gente: hay un lugar para vos aca.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-acento px-8 py-4 text-base font-medium text-white transition-colors hover:bg-acento-oscuro sm:w-auto"
            >
              Ver el repositorio en GitHub
            </a>
            <a
              href="mailto:soporte@reconstruircolombia.org"
              className="flex items-center justify-center border border-zinc-900 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white sm:w-auto"
            >
              Escribir a soporte@reconstruircolombia.org
            </a>
          </div>
        </section>

        <section className="border-t border-zinc-200 py-16 sm:py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Es codigo abierto
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Todo el codigo de reconstruircolombia es publico, bajo licencia{' '}
            <strong className="font-semibold text-zinc-900">AGPL-3.0</strong>.
            Cualquiera puede leerlo, auditarlo, adaptarlo a su propio contexto
            o proponerle cambios. No hay una version cerrada corriendo por
            ahi: lo que ves en produccion es lo que esta en el repositorio.
          </p>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            En el repositorio encuentras la guia{' '}
            <span className="font-medium text-zinc-900">CONTRIBUTING.md</span>{' '}
            con los pasos para levantar el proyecto en local y el flujo de
            contribucion, y el{' '}
            <span className="font-medium text-zinc-900">Codigo de Conducta</span>{' '}
            que rige la colaboracion de todos.
          </p>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-base font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-acento"
          >
            github.com/juanelsinergiadero/reconstruircolombia
            <span aria-hidden="true">→</span>
          </a>
        </section>

        <section className="border-t border-zinc-200 py-16 sm:py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
            El stack tecnico
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-600">
            Para que sepas de una vez si esto encaja con lo que sabes hacer.
            Ademas del sitio, hay un modulo de asistente con IA (RAG) que
            orienta sobre rehabilitacion de vivienda apoyandose en manuales
            tecnicos oficiales.
          </p>

          <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-zinc-200 pt-10 sm:grid-cols-2">
            {STACK.map((item) => (
              <div key={item.categoria}>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-acento">
                  {item.categoria}
                </dt>
                <dd className="mt-1 text-base text-zinc-900">{item.detalle}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-zinc-200 py-16 sm:py-20">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Formas de sumarse
          </h2>

          <div className="mt-8 grid grid-cols-1 divide-y divide-zinc-200 border-b border-zinc-200 sm:grid-cols-2 sm:divide-y-0 sm:gap-x-10 sm:gap-y-10 sm:border-b-0">
            {FORMAS.map((forma) => (
              <div key={forma.titulo} className="py-8 sm:border-t sm:border-zinc-200 sm:py-8">
                <h3 className="text-xl font-semibold">{forma.titulo}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-zinc-600">
                  {forma.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 py-16 sm:py-20">
          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Si esto te movio algo, la mejor forma de empezar es el repositorio.
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600">
            Clona el repo, lee CONTRIBUTING.md y abre tu primer issue o Pull
            Request. Si prefieres escribir primero, o quieres registrar tu
            organizacion, el correo de soporte tambien esta abierto.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-acento px-8 py-4 text-base font-medium text-white transition-colors hover:bg-acento-oscuro sm:w-auto"
            >
              Ir al repositorio
            </a>
            <a
              href="mailto:soporte@reconstruircolombia.org"
              className="flex items-center justify-center border border-zinc-900 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white sm:w-auto"
            >
              Escribir a soporte
            </a>
          </div>

          <p className="mt-10 text-sm text-zinc-500">
            Representas una institucion educativa, JAC, fundacion o
            colectivo, y prefieres empezar por ahi?{' '}
            <Link
              href="/organizaciones/nueva"
              className="font-medium text-zinc-900 underline underline-offset-2"
            >
              Registra tu organizacion
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}

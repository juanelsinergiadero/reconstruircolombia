import Link from 'next/link'
import { auth } from '@/lib/auth'
import { CerrarSesionBoton } from './cerrar-sesion-boton'

// Header persistente, mismo lenguaje visual sobrio de la landing: fondo
// blanco fijo, acento terracota, sin rounded/shadow. El menu movil usa
// <details>/<summary> (disclosure nativo) para no necesitar un Client
// Component aparte; solo el boton de cerrar sesion lo es.

const NAV_LINKS = [
  { href: '/necesidades', label: 'Necesidades' },
  { href: '/organizaciones', label: 'Organizaciones' },
] as const

export async function Header() {
  const session = await auth()
  const usuario = session?.user

  return (
    <header className="relative border-b border-zinc-200 bg-white text-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-900"
        >
          reconstruircolombia
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-acento"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          {usuario ? (
            <>
              <span className="text-sm text-zinc-600">{usuario.name ?? usuario.email}</span>
              <CerrarSesionBoton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-zinc-900 transition-colors hover:text-acento"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/registro"
                className="border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        <details className="group sm:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-center p-2 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Menu</span>
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-zinc-900"
              fill="none"
              strokeWidth={1.75}
              strokeLinecap="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </summary>

          <div className="absolute inset-x-0 top-full border-b border-zinc-200 bg-white px-6 py-4">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-zinc-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4">
              {usuario ? (
                <>
                  <span className="text-sm text-zinc-600">{usuario.name ?? usuario.email}</span>
                  <CerrarSesionBoton />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-base font-medium text-zinc-900"
                  >
                    Iniciar sesion
                  </Link>
                  <Link
                    href="/registro"
                    className="flex items-center justify-center border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}

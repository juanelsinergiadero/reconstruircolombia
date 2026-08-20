import Link from 'next/link'

// Pie de pagina discreto: mismo lenguaje visual sobrio (borde superior fino,
// texto pequeno, acento terracota solo en hover). /colaborar tambien esta en
// el header (ver components/header.tsx); se repite aca junto a GitHub y
// soporte porque es donde alguien que ya esta al final de la pagina lo espera.

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <p>
          reconstruircolombia — plataforma humanitaria de código abierto.
        </p>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/colaborar" className="transition-colors hover:text-acento">
            Colaborar
          </Link>
          <a
            href="https://github.com/juanelsinergiadero/reconstruircolombia"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-acento"
          >
            GitHub
          </a>
          <a
            href="mailto:soporte@reconstruircolombia.org"
            className="transition-colors hover:text-acento"
          >
            Soporte
          </a>
          <Link href="/asistente" className="transition-colors hover:text-acento">
            Asistente virtual (en prueba)
          </Link>
        </nav>
      </div>
    </footer>
  )
}

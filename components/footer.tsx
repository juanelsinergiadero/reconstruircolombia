import Link from 'next/link'

// Pie de pagina discreto: mismo lenguaje visual sobrio (borde superior fino,
// texto pequeno, acento terracota solo en hover). El enlace a /colaborar va
// aca a proposito, no en el header ni en la landing principal: quien busca
// contribuir lo encuentra, sin competir por atencion con damnificados y
// donantes, que son el foco del sitio.

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
        </nav>
      </div>
    </footer>
  )
}

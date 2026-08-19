import { VerificarBoton } from './verificar-boton'

export const metadata = {
  title: 'Verificar correo — reconstruircolombia',
}

export default async function VerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Verificar correo</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Esto es opcional: verificar tu correo suma confianza a tus reportes,
          nunca es requisito para usar la plataforma.
        </p>

        <div className="mt-8">
          {token ? (
            <VerificarBoton token={token} />
          ) : (
            <p className="text-sm text-red-600">Enlace invalido: falta el token.</p>
          )}
        </div>
      </main>
    </div>
  )
}

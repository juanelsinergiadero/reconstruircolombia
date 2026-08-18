import { rutaCallbackSegura } from '@/lib/url'
import { RegistroForm } from './registro-form'

export const metadata = {
  title: 'Crear cuenta — reconstruircolombia',
}

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const params = await searchParams
  const callbackUrl = rutaCallbackSegura(params.callbackUrl)

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Necesitas una cuenta para registrar una necesidad.
        </p>

        <div className="mt-8">
          <RegistroForm callbackUrl={callbackUrl} />
        </div>
      </main>
    </div>
  )
}

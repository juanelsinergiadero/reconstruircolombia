import { rutaCallbackSegura } from '@/lib/url'
import { SignInForm } from './sign-in-form'

export const metadata = {
  title: 'Iniciar sesion — reconstruircolombia',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const params = await searchParams
  const callbackUrl = rutaCallbackSegura(params.callbackUrl)

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesion</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Inicia sesion para registrar una necesidad o hacer seguimiento.
        </p>

        <div className="mt-8">
          <SignInForm callbackUrl={callbackUrl} />
        </div>
      </main>
    </div>
  )
}

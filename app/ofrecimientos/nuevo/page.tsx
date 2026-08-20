import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getDepartamentos } from '@/lib/geo'
import { OfrecimientoForm } from './ofrecimiento-form'

export const metadata = {
  title: 'Ofrece tu ayuda — reconstruircolombia',
}

export default async function NuevoOfrecimientoPage() {
  // El middleware trata /ofrecimientos/* como publico (lectura del listado).
  // Ofrecer ayuda SI requiere sesion, asi que se valida aqui ademas de en la
  // Server Action, para no mostrarle el formulario a quien no puede enviarlo.
  const usuario = await getAuthUser()
  if (!usuario) {
    redirect('/sign-in?callbackUrl=/ofrecimientos/nuevo')
  }

  const departamentos = await getDepartamentos()

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Ofrece tu ayuda</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cuenta que puedes ofrecer y donde. Tus datos de contacto solo se
          comparten por canal controlado, nunca en el listado publico.
        </p>

        <div className="mt-8">
          <OfrecimientoForm
            departamentos={departamentos}
            defaultContactoNombre={usuario.name ?? undefined}
            defaultContactoEmail={usuario.email ?? undefined}
          />
        </div>
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getDepartamentos } from '@/lib/geo'
import { NecesidadForm } from './necesidad-form'

export const metadata = {
  title: 'Registrar necesidad — reconstruircolombia',
}

export default async function NuevaNecesidadPage() {
  // El middleware trata /necesidades/* como publico (lectura del listado).
  // Registrar SI requiere sesion, asi que se valida aqui ademas de en la
  // Server Action, para no mostrarle el formulario a quien no puede enviarlo.
  const usuario = await getAuthUser()
  if (!usuario) {
    redirect('/sign-in?callbackUrl=/necesidades/nueva')
  }

  const departamentos = await getDepartamentos()

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Registrar necesidad</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cuenta que necesitas y donde. Tus datos de contacto solo se comparten
          por canal controlado, nunca en el listado publico.
        </p>

        <div className="mt-8">
          <NecesidadForm
            departamentos={departamentos}
            defaultContactoNombre={usuario.name ?? undefined}
            defaultContactoEmail={usuario.email ?? undefined}
          />
        </div>
      </main>
    </div>
  )
}

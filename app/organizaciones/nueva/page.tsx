import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getDepartamentos } from '@/lib/geo'
import { OrganizacionForm } from './organizacion-form'

export const metadata = {
  title: 'Registrar organizacion — reconstruircolombia',
}

export default async function NuevaOrganizacionPage() {
  // El middleware trata /organizaciones/* como publico (lectura del
  // listado y detalle). Registrar SI requiere sesion, asi que se valida
  // aqui ademas de en la Server Action, para no mostrarle el formulario a
  // quien no puede enviarlo.
  const usuario = await getAuthUser()
  if (!usuario) {
    redirect('/sign-in?callbackUrl=/organizaciones/nueva')
  }

  // Un usuario pertenece a UNA organizacion (modelo v1, sin flujo para
  // unirse a una existente). Si ya tiene una, evitamos mostrarle el
  // formulario de creacion y lo mandamos a la suya.
  const usuarioActual = await prisma.user.findUnique({
    where: { id: usuario.id },
    select: { organizacionId: true },
  })

  if (usuarioActual?.organizacionId) {
    redirect(`/organizaciones/${usuarioActual.organizacionId}`)
  }

  const departamentos = await getDepartamentos()

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Registrar organizacion</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Instituciones educativas, JAC, fundaciones y colectivos pueden
          registrarse para respaldar necesidades y aparecer en el listado
          publico. Este es el nivel <strong>Registrada</strong>: la
          verificacion con documentos llega despues.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Quedaras vinculado a esta organizacion.{' '}
          <Link href="/organizaciones" className="underline underline-offset-2">
            Ver organizaciones registradas
          </Link>
        </p>

        <div className="mt-8">
          <OrganizacionForm departamentos={departamentos} />
        </div>
      </main>
    </div>
  )
}

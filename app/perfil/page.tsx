import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ReenviarVerificacionBoton } from './reenviar-verificacion-boton'

export const metadata = {
  title: 'Mi perfil — reconstruircolombia',
}

export default async function PerfilPage() {
  const usuario = await getAuthUser()
  if (!usuario) {
    redirect('/sign-in?callbackUrl=/perfil')
  }

  const datos = await prisma.user.findUnique({
    where: { id: usuario.id },
    select: { nombre: true, email: true, emailVerificado: true },
  })
  if (!datos) {
    redirect('/sign-in?callbackUrl=/perfil')
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6">
      <main className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>

        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Nombre</dt>
            <dd className="font-medium">{datos.nombre ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Correo</dt>
            <dd className="font-medium">{datos.email}</dd>
          </div>
        </dl>

        <div className="mt-6 border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {datos.emailVerificado ? (
            <p className="inline-block border border-acento px-3 py-1 text-sm font-medium text-acento">
              Correo verificado
            </p>
          ) : (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Tu correo aun no esta verificado. Esto es opcional: puedes
                seguir usando la plataforma igual. Verificarlo suma
                confianza a tus reportes.
              </p>
              <div className="mt-3">
                <ReenviarVerificacionBoton />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

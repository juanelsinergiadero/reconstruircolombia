import { prisma } from '@/lib/prisma'

// Capa de acceso a datos geograficos (DIVIPOLA sembrada).
// Alimenta el selector jerarquico departamento -> municipio del formulario
// y los filtros del listado publico.

// Todos los departamentos, ordenados por nombre para el <select>.
export async function getDepartamentos() {
  return prisma.departamento.findMany({
    select: { codigo: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })
}

// Municipios de un departamento (por codigo de 2 digitos), ordenados.
// Se usa cuando el usuario elige departamento y hay que poblar municipios.
export async function getMunicipiosPorDepartamento(departamentoCodigo: string) {
  return prisma.municipio.findMany({
    where: { departamentoCodigo },
    select: { codigo: true, nombre: true, slug: true },
    orderBy: { nombre: 'asc' },
  })
}

// Verifica que un codigo de municipio exista (validacion de integridad en
// la Server Action, ademas del regex de Zod).
export async function municipioExiste(codigo: string): Promise<boolean> {
  const m = await prisma.municipio.findUnique({
    where: { codigo },
    select: { codigo: true },
  })
  return m !== null
}

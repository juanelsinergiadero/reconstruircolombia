// Recuperacion de fragmentos por similitud coseno (pgvector). Dada una
// pregunta en espanol, la vectoriza con el mismo modelo de embeddings usado
// para indexar y devuelve los N fragmentos mas cercanos, con su fuente.

import { prisma } from '../prisma'
import { embeber, vectorALiteral } from './embeddings'

export interface ResultadoBusqueda {
  id: string
  manual: string
  tituloManual: string
  seccion: string | null
  pagina: number | null
  texto: string
  similitud: number
}

interface FilaBusqueda {
  id: string
  manual: string
  titulo_manual: string
  seccion: string | null
  pagina: number | null
  texto: string
  similitud: number
}

export async function buscarFragmentos(pregunta: string, n = 5): Promise<ResultadoBusqueda[]> {
  const [vector] = await embeber([pregunta], 'query')
  const literal = vectorALiteral(vector)

  const filas = await prisma.$queryRawUnsafe<FilaBusqueda[]>(
    `SELECT id, manual, titulo_manual, seccion, pagina, texto,
            1 - (embedding <=> $1::vector) AS similitud
     FROM fragmentos_manual
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    literal,
    n
  )

  return filas.map((f) => ({
    id: f.id,
    manual: f.manual,
    tituloManual: f.titulo_manual,
    seccion: f.seccion,
    pagina: f.pagina,
    texto: f.texto,
    similitud: f.similitud,
  }))
}

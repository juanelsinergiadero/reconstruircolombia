// =============================================================
// Indexa los manuales tecnicos de la AIS en pgvector (RAG, Fase 1).
//
// Uso:
//   pnpm tsx scripts/rag/indexar-manuales.ts
//
// Requiere: reconstruir-db-dev y reconstruir-embeddings-dev arriba
// (docker compose -f docker-compose.dev.yml up -d).
//
// Idempotente: antes de indexar un manual borra sus fragmentos previos
// (por codigo `manual`), asi que se puede volver a correr sin duplicar.
// =============================================================

import path from 'node:path'
import { prisma } from '../../lib/prisma'
import { embeber, vectorALiteral } from '../../lib/rag/embeddings'
import { fragmentarPdf } from '../../lib/rag/fragmentar'

const CARPETA_MANUALES = path.join(process.cwd(), 'prisma', 'data', 'manuales')

const MANUALES = [
  {
    archivo: 'adobe_tapia.pdf',
    manual: 'adobe_tapia',
    tituloManual: 'Manual para la rehabilitación de viviendas construidas en adobe y tapia pisada (AIS)',
  },
  {
    archivo: 'mamposteria_part1.pdf',
    manual: 'mamposteria_p1',
    tituloManual:
      'Manual de construcción, evaluación y rehabilitación sismo resistente de viviendas de mampostería (AIS) — parte 1 de 2',
  },
  {
    archivo: 'mamposteria_part2.pdf',
    manual: 'mamposteria_p2',
    tituloManual:
      'Manual de construcción, evaluación y rehabilitación sismo resistente de viviendas de mampostería (AIS) — parte 2 de 2',
  },
]

const TAMANO_LOTE_EMBEDDING = 16

async function indexarManual(config: (typeof MANUALES)[number]) {
  const rutaPdf = path.join(CARPETA_MANUALES, config.archivo)
  console.log(`\n== ${config.tituloManual} ==`)
  console.log(`Extrayendo y fragmentando ${config.archivo}...`)

  const fragmentos = fragmentarPdf(rutaPdf)
  console.log(`${fragmentos.length} fragmentos generados.`)

  await prisma.$executeRawUnsafe(`DELETE FROM fragmentos_manual WHERE manual = $1`, config.manual)

  let indexados = 0
  for (let i = 0; i < fragmentos.length; i += TAMANO_LOTE_EMBEDDING) {
    const lote = fragmentos.slice(i, i + TAMANO_LOTE_EMBEDDING)
    const vectores = await embeber(
      lote.map((f) => f.texto),
      'passage'
    )

    for (let j = 0; j < lote.length; j++) {
      const fragmento = lote[j]
      const literal = vectorALiteral(vectores[j])
      await prisma.$executeRawUnsafe(
        `INSERT INTO fragmentos_manual (id, manual, titulo_manual, seccion, pagina, texto, embedding)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::vector)`,
        config.manual,
        config.tituloManual,
        fragmento.seccion,
        fragmento.pagina,
        fragmento.texto,
        literal
      )
      indexados++
    }
    process.stdout.write(`\r${indexados}/${fragmentos.length} indexados`)
  }
  console.log('')
}

async function main() {
  for (const config of MANUALES) {
    await indexarManual(config)
  }

  const [{ total }] = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
    `SELECT count(*)::bigint AS total FROM fragmentos_manual`
  )
  console.log(`\nTotal de fragmentos indexados en pgvector: ${total}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

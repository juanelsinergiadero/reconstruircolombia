// =============================================================
// Consulta de prueba contra el indice RAG (Fase 1). Sin LLM: solo muestra
// que fragmentos recupera pgvector para una pregunta dada.
//
// Uso:
//   pnpm tsx scripts/rag/consulta-prueba.ts "pregunta en español" [n]
// =============================================================

import { prisma } from '../../lib/prisma'
import { buscarFragmentos } from '../../lib/rag/buscar'

async function main() {
  const pregunta = process.argv[2]
  const n = process.argv[3] ? parseInt(process.argv[3], 10) : 5

  if (!pregunta) {
    console.error('Uso: pnpm tsx scripts/rag/consulta-prueba.ts "pregunta en español" [n]')
    process.exitCode = 1
    return
  }

  console.log(`Pregunta: ${pregunta}\n`)
  const resultados = await buscarFragmentos(pregunta, n)

  resultados.forEach((r, i) => {
    console.log(`--- #${i + 1} (similitud: ${r.similitud.toFixed(4)}) ---`)
    console.log(`Fuente: ${r.tituloManual}${r.pagina ? `, pág. ${r.pagina}` : ''}`)
    if (r.seccion) console.log(`Sección: ${r.seccion}`)
    console.log(r.texto)
    console.log('')
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// Extraccion y fragmentacion de PDFs para el indice RAG (Fase 1).
// Usa pdftotext (poppler-utils), robusto para el texto denso de los
// manuales tecnicos de la AIS. Cada pagina se separa por el caracter de
// salto de pagina (\f) que produce pdftotext, lo que permite anotar de que
// pagina viene cada fragmento (para citar la fuente despues).

import { execFileSync } from 'node:child_process'

export interface Fragmento {
  texto: string
  pagina: number | null
  seccion: string | null
}

interface ParrafoConPagina {
  pagina: number
  texto: string
}

const MAX_CHARS_FRAGMENTO = 1200
const SOLAPAMIENTO_CHARS = 200

function extraerPaginas(rutaPdf: string): string[] {
  const salida = execFileSync('pdftotext', [rutaPdf, '-'], {
    maxBuffer: 1024 * 1024 * 50,
    encoding: 'utf-8',
  })
  return salida.split('\f')
}

// Los manuales repiten el titulo como encabezado en cada pagina: es ruido
// para los fragmentos. Se elimina cualquier linea que aparezca identica en
// mas de la mitad de las paginas (encabezados/pies de pagina repetidos).
function quitarEncabezadosRepetidos(paginas: string[]): string[] {
  const conteo = new Map<string, number>()
  for (const pagina of paginas) {
    const lineas = new Set(
      pagina
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    )
    for (const linea of lineas) conteo.set(linea, (conteo.get(linea) ?? 0) + 1)
  }
  const umbral = paginas.length * 0.5
  const repetidas = new Set([...conteo.entries()].filter(([, n]) => n > umbral).map(([l]) => l))

  return paginas.map((pagina) =>
    pagina
      .split('\n')
      .filter((linea) => !repetidas.has(linea.trim()))
      .join('\n')
  )
}

// Heuristica de titulo de seccion: linea corta, mayoritariamente en
// mayusculas. No es perfecto (los manuales no tienen una jerarquia XML de
// secciones) pero da una pista util para citar la fuente.
function esEncabezadoDeSeccion(parrafo: string): boolean {
  const texto = parrafo.trim()
  if (texto.length === 0 || texto.length > 120) return false
  const letras = texto.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ]/g, '')
  if (letras.length < 3) return false
  const mayusculas = letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, '')
  return mayusculas.length / letras.length > 0.7
}

function paginaAParrafos(pagina: number, texto: string): ParrafoConPagina[] {
  return texto
    .split(/\n\s*\n/)
    .map((bloque) => bloque.replace(/\s*\n\s*/g, ' ').trim())
    .filter((bloque) => bloque.length > 0)
    .map((texto) => ({ pagina, texto }))
}

export function fragmentarPdf(rutaPdf: string): Fragmento[] {
  const paginas = quitarEncabezadosRepetidos(extraerPaginas(rutaPdf))
  const parrafos = paginas.flatMap((texto, i) => paginaAParrafos(i + 1, texto))

  const fragmentos: Fragmento[] = []
  let seccionActual: string | null = null
  let chunkActual = ''
  let paginaInicioChunk: number | null = null

  const cerrarChunk = () => {
    const texto = chunkActual.trim()
    if (texto.length > 0) {
      fragmentos.push({ texto, pagina: paginaInicioChunk, seccion: seccionActual })
    }
  }

  for (const parrafo of parrafos) {
    if (esEncabezadoDeSeccion(parrafo.texto)) seccionActual = parrafo.texto
    if (paginaInicioChunk === null) paginaInicioChunk = parrafo.pagina

    const separador = chunkActual.length > 0 ? '\n\n' : ''
    const excede = chunkActual.length + separador.length + parrafo.texto.length > MAX_CHARS_FRAGMENTO

    if (excede && chunkActual.length > 0) {
      const cola = chunkActual.slice(-SOLAPAMIENTO_CHARS)
      cerrarChunk()
      chunkActual = cola
      paginaInicioChunk = parrafo.pagina
      chunkActual += (chunkActual.length > 0 ? '\n\n' : '') + parrafo.texto
    } else {
      chunkActual += separador + parrafo.texto
    }
  }
  cerrarChunk()

  return fragmentos.filter((f) => f.texto.length > 30)
}

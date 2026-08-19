// Extraccion y fragmentacion de PDFs para el indice RAG (Fase 1, pasada de
// limpieza). Usa pdftotext (poppler-utils), robusto para el texto denso de
// los manuales tecnicos de la AIS. Cada pagina se separa por el caracter de
// salto de pagina (\f) que produce pdftotext, lo que permite anotar de que
// pagina viene cada fragmento (para citar la fuente despues).
//
// Los manuales AIS comparten una estructura predecible que genera ruido de
// extraccion bien identificable: portada + creditos + tabla de contenido al
// inicio, bibliografia numerada al final, y en cada pagina de contenido un
// encabezado repetido (titulo del manual/capitulo + atribucion AIS) mas un
// numero de pagina suelto tipo "3-15". Se recorta ese ruido antes de
// fragmentar, en vez de intentar limpiar fragmento por fragmento.

import { execFileSync } from 'node:child_process'

export interface Fragmento {
  texto: string
  pagina: number | null
  seccion: string | null
}

interface ParrafoConPagina {
  pagina: number
  texto: string
  seccion: string | null
}

const MAX_CHARS_FRAGMENTO = 1200
const SOLAPAMIENTO_CHARS = 200

// Umbral para reconocer el primer parrafo de prosa real (fin de portada y
// tabla de contenido): suficientemente largo y con varias oraciones. Los
// titulos de la tabla de contenido y las lineas de creditos son cortos o de
// una sola oracion, y nunca llegan a este umbral.
const MIN_CHARS_PARRAFO_PROSA = 200
const MIN_QUIEBRES_ORACION_PROSA = 1

function extraerPaginas(rutaPdf: string): string[] {
  const salida = execFileSync('pdftotext', [rutaPdf, '-'], {
    maxBuffer: 1024 * 1024 * 50,
    encoding: 'utf-8',
  })
  return salida.split('\f')
}

function quitarAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Clave normalizada para comparar lineas de encabezado entre paginas: la
// AIS no es consistente con el espaciado alrededor de guiones ("AIS-" vs
// "AIS -"), asi que dos variantes del mismo encabezado deben contar como
// la misma linea.
function normalizarClaveLinea(linea: string): string {
  return quitarAcentos(linea.trim().toLowerCase())
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
}

// Numero de pagina suelto que pdftotext deja como linea propia: "3-15",
// "5-24", o un numero simple.
const RE_NUMERO_PAGINA = /^\d{1,4}(\s*[-–]\s*\d{1,4})?$/

// Atribucion institucional que la AIS repite en (casi) cada pagina.
const RE_ATRIBUCION_AIS = /^ASOCIACI[OÓ]N COLOMBIANA DE INGENIER[IÍ]A S[IÍ]SMICA/i

// Encabezados repetidos: el titulo del manual o del capitulo, que cambia de
// texto entre secciones pero siempre aparece como una de las primeras
// lineas de la pagina. Contar solo esas posiciones (en vez de la pagina
// completa) evita confundir un encabezado de pagina con un subtitulo de
// contenido que tambien se repite muchas veces (p.ej. "DAÑOS LEVES").
const LINEAS_CANDIDATAS_ENCABEZADO = 2
const MIN_REPETICIONES_ENCABEZADO = 3

function detectarEncabezadosRepetidos(paginas: string[]): Set<string> {
  const conteo = new Map<string, number>()
  for (const pagina of paginas) {
    const lineas = pagina
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    for (const linea of lineas.slice(0, LINEAS_CANDIDATAS_ENCABEZADO)) {
      if (RE_NUMERO_PAGINA.test(linea) || RE_ATRIBUCION_AIS.test(linea)) continue
      const clave = normalizarClaveLinea(linea)
      if (!clave) continue
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
    }
  }
  return new Set([...conteo.entries()].filter(([, n]) => n >= MIN_REPETICIONES_ENCABEZADO).map(([clave]) => clave))
}

// Quita de cada pagina: numeros de pagina sueltos, la atribucion AIS y los
// encabezados de titulo repetidos (esten donde esten en la pagina).
function quitarRuidoDePagina(paginas: string[]): string[] {
  const encabezadosRepetidos = detectarEncabezadosRepetidos(paginas)

  return paginas.map((pagina) =>
    pagina
      .split('\n')
      .filter((linea) => {
        const t = linea.trim()
        if (!t) return true
        if (RE_NUMERO_PAGINA.test(t)) return false
        if (RE_ATRIBUCION_AIS.test(t)) return false
        if (encabezadosRepetidos.has(normalizarClaveLinea(t))) return false
        return true
      })
      .join('\n')
  )
}

// Heuristica de titulo de seccion: linea corta, mayoritariamente en
// mayusculas. No es perfecto (los manuales no tienen una jerarquia XML de
// secciones) pero da una pista util para citar la fuente, y captura los
// niveles "DAÑOS LEVES/MODERADOS/SEVEROS" tal como aparecen en el texto.
function esEncabezadoDeSeccion(parrafo: string): boolean {
  const texto = parrafo.trim()
  if (texto.length === 0 || texto.length > 120) return false
  const letras = texto.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ]/g, '')
  if (letras.length < 3) return false
  const mayusculas = letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, '')
  return mayusculas.length / letras.length > 0.7
}

// Cuenta quiebres de oracion. Un parrafo de una sola frase (como suele
// ocurrir en creditos o titulos largos) no cuenta como prosa aunque sea
// largo. No es un conteo perfecto de oraciones (los manuales usan puntos
// tambien en abreviaturas de titulos, "Ing.", "A.1", etc.) por eso se
// combina con la fraccion de mayusculas de mas abajo.
function contarQuiebresDeOracion(texto: string): number {
  return (texto.match(/[.!?]\s+/g) ?? []).length
}

// Los listados de creditos y los encabezados de la tabla de contenido son
// casi puros nombres propios o titulos ("Ingeniero Omar Darío Cardona A.,
// Director General...", "TABLA DE CONTENIDO INTRODUCCIÓN..."): una fraccion
// muy alta de palabras que empiezan en mayuscula. La prosa tecnica real,
// aunque tenga alguna sigla o nombre propio, se mantiene mayoritariamente
// en minusculas.
const MAX_FRACCION_MAYUSCULAS_PROSA = 0.4

function fraccionPalabrasConMayuscula(texto: string): number {
  const palabras = texto.split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return 1
  const conMayuscula = palabras.filter((p) => /^[A-ZÁÉÍÓÚÑ]/.test(p)).length
  return conMayuscula / palabras.length
}

// Los esquemas de tabla de contenido que quedaron fusionados en un solo
// parrafo (sin saltos de linea en blanco entre viñetas) delatan su
// estructura de lista por la cantidad de guiones de viñeta (" - ").
const MAX_GUIONES_PROSA = 1

function contarGuionesDeVineta(texto: string): number {
  return (texto.match(/ [-–] /g) ?? []).length
}

function esParrafoDeProsa(texto: string): boolean {
  return (
    texto.length >= MIN_CHARS_PARRAFO_PROSA &&
    contarQuiebresDeOracion(texto) >= MIN_QUIEBRES_ORACION_PROSA &&
    fraccionPalabrasConMayuscula(texto) <= MAX_FRACCION_MAYUSCULAS_PROSA &&
    contarGuionesDeVineta(texto) <= MAX_GUIONES_PROSA
  )
}

// El titulo "BIBLIOGRAFÍA" a veces queda como parrafo propio, a veces
// pegado sin salto de linea en blanco a la primera referencia numerada
// ("BIBLIOGRAFÍA\n1. Norma colombiana...") y a veces en la pagina separadora
// del capitulo ("CAPÍTULO VI\nBIBLIOGRAFÍA"). Se acepta cualquiera de las
// tres: al inicio del parrafo, o como palabra suelta en un parrafo corto
// (la propia pagina separadora, sin contenido tecnico que valga la pena
// conservar).
function esEncabezadoDeBibliografia(texto: string): boolean {
  const normalizado = quitarAcentos(texto.trim().toUpperCase())
  if (/^BIBLIOGRAFIA\b/.test(normalizado)) return true
  return normalizado.length < 60 && /\bBIBLIOGRAFIA\b/.test(normalizado)
}

function paginaAParrafos(pagina: number, texto: string): ParrafoConPagina[] {
  return texto
    .split(/\n\s*\n/)
    .map((bloque) => bloque.replace(/\s*\n\s*/g, ' ').trim())
    .filter((bloque) => bloque.length > 0)
    .map((texto) => ({ pagina, texto, seccion: null }))
}

// Asigna a cada parrafo el encabezado de seccion vigente en ese punto del
// documento (el ultimo encabezado visto antes o en el propio parrafo). Se
// calcula en una pasada previa, sobre el orden final de parrafos, para que
// el fragmento cite la seccion vigente en su primer parrafo y no un
// encabezado posterior que solo alcanzo a formar parte del fragmento
// siguiente por el solapamiento.
function asignarSeccionActiva(parrafos: ParrafoConPagina[]): ParrafoConPagina[] {
  let seccionActual: string | null = null
  return parrafos.map((p) => {
    if (esEncabezadoDeSeccion(p.texto)) seccionActual = p.texto
    return { ...p, seccion: seccionActual }
  })
}

// Las listas de "DAÑOS LEVES/MODERADOS/SEVEROS" numeran su primer item en
// una linea propia, separada del texto del item por el espaciado de la
// viñeta ("DAÑOS LEVES\n1.\n\nPequeñas grietas..."), asi que pdftotext deja
// el "1." pegado al encabezado en vez del parrafo que describe el daño. Se
// reubica ese marcador huerfano al inicio del siguiente parrafo para que la
// descripcion quede completa y legible.
const RE_MARCADOR_HUERFANO_FINAL = /\s(\d{1,2}\.)$/

function reubicarMarcadoresDeLista(parrafos: ParrafoConPagina[]): ParrafoConPagina[] {
  const resultado: ParrafoConPagina[] = []
  for (let i = 0; i < parrafos.length; i++) {
    const actual = parrafos[i]
    const siguiente = parrafos[i + 1]
    const coincidencia = actual.texto.match(RE_MARCADOR_HUERFANO_FINAL)

    if (coincidencia && siguiente && !/^\d{1,2}\./.test(siguiente.texto)) {
      const textoSinMarcador = actual.texto.slice(0, coincidencia.index).trimEnd()
      if (textoSinMarcador.length > 0) resultado.push({ ...actual, texto: textoSinMarcador })
      parrafos[i + 1] = { ...siguiente, texto: `${coincidencia[1]} ${siguiente.texto}` }
      continue
    }
    resultado.push(actual)
  }
  return resultado
}

// Portada, creditos y tabla de contenido: recorta todo antes del comienzo
// sostenido de prosa real. No basta con la primera pagina que tenga un
// parrafo largo: en el manual de mamposteria parte 1 la introduccion (un
// parrafo de prosa genuino) esta seguida por varias paginas de tabla de
// contenido en forma de esquema (titulos y viñetas cortas, sin prosa), asi
// que una sola pagina con prosa no confirma que ya se entro al cuerpo del
// manual. Se exige una racha de paginas consecutivas con prosa para
// confirmarlo.
const RACHA_PAGINAS_PROSA = 2

function indiceInicioContenido(paginasParrafos: ParrafoConPagina[][]): number {
  for (let i = 0; i <= paginasParrafos.length - RACHA_PAGINAS_PROSA; i++) {
    const racha = paginasParrafos
      .slice(i, i + RACHA_PAGINAS_PROSA)
      .every((parrafos) => parrafos.some((p) => esParrafoDeProsa(p.texto)))
    if (racha) return i
  }
  return 0
}

// Bibliografia final: en los manuales que la incluyen (mamposteria parte 2,
// adobe y tapia) es siempre el ultimo capitulo y arranca con un parrafo
// "BIBLIOGRAFÍA" propio, seguido de una lista numerada de referencias sin
// valor tecnico para la recuperacion. Se busca solo a partir del inicio del
// contenido real para no confundirla con la mencion homonima dentro de la
// tabla de contenido.
function indiceFinContenido(paginasParrafos: ParrafoConPagina[][], inicio: number): number {
  for (let i = inicio; i < paginasParrafos.length; i++) {
    if (paginasParrafos[i].some((p) => esEncabezadoDeBibliografia(p.texto))) return i
  }
  return paginasParrafos.length
}

function longitudTexto(parrafos: ParrafoConPagina[]): number {
  return parrafos.reduce((acc, p, i) => acc + p.texto.length + (i > 0 ? 2 : 0), 0)
}

// Agrupa parrafos en fragmentos de hasta MAX_CHARS_FRAGMENTO, cortando
// siempre en un limite de parrafo (nunca a media frase). El solapamiento
// entre fragmentos consecutivos arrastra los ultimos parrafos completos del
// fragmento anterior (hasta ~SOLAPAMIENTO_CHARS), en vez de un recorte
// crudo de caracteres que podria partir una oracion por la mitad.
function agruparEnFragmentos(parrafos: ParrafoConPagina[]): Fragmento[] {
  const fragmentos: Fragmento[] = []
  let chunkActual: ParrafoConPagina[] = []

  const cerrarChunk = () => {
    if (chunkActual.length === 0) return
    const texto = chunkActual
      .map((p) => p.texto)
      .join('\n\n')
      .trim()
    if (texto.length > 0) {
      fragmentos.push({ texto, pagina: chunkActual[0].pagina, seccion: chunkActual[0].seccion })
    }
  }

  for (const parrafo of parrafos) {
    const excede = longitudTexto([...chunkActual, parrafo]) > MAX_CHARS_FRAGMENTO

    if (excede && chunkActual.length > 0) {
      cerrarChunk()

      const cola: ParrafoConPagina[] = []
      for (let i = chunkActual.length - 1; i >= 0; i--) {
        const candidato = chunkActual[i]
        if (cola.length > 0 && longitudTexto([candidato, ...cola]) > SOLAPAMIENTO_CHARS) break
        cola.unshift(candidato)
      }
      chunkActual = cola
    }

    chunkActual.push(parrafo)
  }
  cerrarChunk()

  return fragmentos.filter((f) => f.texto.length > 30)
}

export function fragmentarPdf(rutaPdf: string): Fragmento[] {
  const paginasLimpias = quitarRuidoDePagina(extraerPaginas(rutaPdf))
  const paginasParrafos = paginasLimpias.map((texto, i) =>
    reubicarMarcadoresDeLista(paginaAParrafos(i + 1, texto))
  )

  const inicio = indiceInicioContenido(paginasParrafos)
  const fin = indiceFinContenido(paginasParrafos, inicio)
  const parrafos = asignarSeccionActiva(paginasParrafos.slice(inicio, fin).flat())

  return agruparEnFragmentos(parrafos)
}

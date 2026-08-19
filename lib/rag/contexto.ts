import type { ResultadoBusqueda } from './buscar'

// Arma el bloque de contexto que se agrega como mensaje de sistema aparte,
// despues del prompt de seguridad (que no se toca): los fragmentos de los
// manuales AIS recuperados para la pregunta actual, con su cita de fuente,
// para que el asistente responda ciñendose a ellos en vez de inventar.
export function construirContextoRag(fragmentos: ResultadoBusqueda[]): string {
  if (fragmentos.length === 0) {
    return 'No se encontraron fragmentos de los manuales tecnicos relevantes para esta pregunta.'
  }

  const bloques = fragmentos.map((f, i) => {
    const cita = [f.tituloManual, f.pagina ? `pág. ${f.pagina}` : null, f.seccion].filter(Boolean).join(' — ')
    return `[Fragmento ${i + 1} — ${cita}]\n${f.texto}`
  })

  return [
    'Fragmentos de los manuales tecnicos de la AIS recuperados para esta pregunta. Son tu unica fuente para temas de rehabilitacion de vivienda: si no cubren lo que te preguntan, dilo con honestidad en vez de inventar. La etiqueta "Fragmento N" es solo para que ubiques de cual hablas tu mismo: al citar frente a la persona, nombra el manual (por ejemplo "el manual de adobe y tapia pisada de la AIS"), nunca digas "Fragmento N".',
    '',
    ...bloques,
  ].join('\n\n')
}

// El chat que consume esta respuesta muestra texto plano (no interpreta
// Markdown), asi que encabezados con #, tablas o **negritas** se verian
// como simbolos sueltos en vez de formato. Esta instruccion es sobre COMO
// se presenta el texto, no sobre que puede o no decir el asistente, por eso
// va aparte del prompt de seguridad.
export const INSTRUCCIONES_FORMATO_CHAT =
  'Este chat muestra texto plano, no interpreta Markdown: no uses #, ##, **negritas**, tablas ni lineas separadoras (---). Si necesitas una lista, escribe cada punto en su propia linea con un guion simple. Escribe en parrafos breves, como en una conversacion.'

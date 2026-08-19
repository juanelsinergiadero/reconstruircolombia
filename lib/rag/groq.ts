// Cliente minimo para Groq (API compatible con OpenAI: mismo formato de
// /chat/completions). Se usa fetch nativo en vez de un SDK porque es una
// sola llamada con streaming; no justifica una dependencia mas.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Al construir esto (agosto 2026) no hay ningun modelo de chat Llama activo
// en la cuenta de Groq usada (solo llama-prompt-guard-2, un clasificador de
// moderacion de 512 tokens de contexto, no un modelo de chat) — se pidio
// Llama pero el catalogo actual de Groq ya no lo ofrece con esta API key.
// Se eligio openai/gpt-oss-120b tras probarlo en vivo: modelo grande
// (120B, contexto de 131k), respuestas limpias y correctas en español, sin
// bloques de razonamiento filtrados en el contenido (a diferencia de
// qwen/qwen3.6-27b, que expone su <think>...</think> por defecto). Revisar
// en console.groq.com/docs/models si vuelve a haber un Llama de chat
// disponible antes de publicar el asistente.
export const MODELO_GROQ = 'openai/gpt-oss-120b'

export interface MensajeChat {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChunkGroq {
  choices?: { delta?: { content?: string } }[]
}

// Llama a Groq con streaming y va entregando el texto a medida que llega
// (delta por delta), parseando el Server-Sent Events de la respuesta.
export async function* generarRespuestaStreaming(mensajes: MensajeChat[]): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY no esta configurada')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELO_GROQ,
      messages: mensajes,
      stream: true,
      temperature: 0.4,
      max_tokens: 2048,
    }),
  })

  if (!res.ok || !res.body) {
    const detalle = await res.text().catch(() => '')
    throw new Error(`Groq respondio ${res.status}: ${detalle}`)
  }

  const lector = res.body.getReader()
  const decodificador = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await lector.read()
    if (done) break
    buffer += decodificador.decode(value, { stream: true })

    const lineas = buffer.split('\n')
    buffer = lineas.pop() ?? ''

    for (const linea of lineas) {
      const t = linea.trim()
      if (!t.startsWith('data:')) continue
      const data = t.slice('data:'.length).trim()
      if (data === '[DONE]') return

      try {
        const json: ChunkGroq = JSON.parse(data)
        const texto = json.choices?.[0]?.delta?.content
        if (texto) yield texto
      } catch {
        // Lineas que no son JSON valido (comentarios keep-alive, etc.): se ignoran.
      }
    }
  }
}

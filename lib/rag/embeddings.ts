// Cliente del servicio interno de embeddings (ver embeddings/app.py). Modelo
// local (intfloat/multilingual-e5-small, 384 dimensiones), sin API externa.

const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL ?? 'http://127.0.0.1:8007'

type TipoEmbedding = 'query' | 'passage'

interface RespuestaEmbed {
  embeddings: number[][]
  dimensiones: number
  modelo: string
}

export async function embeber(textos: string[], tipo: TipoEmbedding): Promise<number[][]> {
  if (textos.length === 0) return []

  const res = await fetch(`${EMBEDDINGS_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textos, tipo }),
  })

  if (!res.ok) {
    throw new Error(`Servicio de embeddings respondio ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as RespuestaEmbed
  return data.embeddings
}

// Convierte un vector a la representacion textual que pgvector acepta al
// castear con ::vector, ej. '[0.1,0.2,0.3]'.
export function vectorALiteral(vector: number[]): string {
  return `[${vector.join(',')}]`
}

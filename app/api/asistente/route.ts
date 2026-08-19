// Endpoint del asistente (Fase 2, RAG + Groq). No enlazado desde ninguna
// parte visible del sitio: se prueba por URL directa (/asistente) antes de
// publicarlo. Ver lib/rag/prompt-sistema.md para el nucleo de seguridad.

import { buscarFragmentos } from '@/lib/rag/buscar'
import { construirContextoRag, INSTRUCCIONES_FORMATO_CHAT } from '@/lib/rag/contexto'
import { generarRespuestaStreaming, type MensajeChat } from '@/lib/rag/groq'
import { obtenerIpDeRequest, verificarLimiteDeTasa } from '@/lib/rag/limite-tasa'
import { obtenerPromptSistema } from '@/lib/rag/prompt-sistema'
import { peticionAsistenteSchema } from '@/lib/validations/asistente'

const CANTIDAD_FRAGMENTOS_RAG = 5

export async function POST(request: Request) {
  const ip = obtenerIpDeRequest(request)
  const limite = verificarLimiteDeTasa(ip)
  if (!limite.permitido) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Espera un momento antes de volver a escribir.' },
      { status: 429, headers: { 'Retry-After': String(limite.reintentarEnSegundos ?? 60) } }
    )
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo de la peticion invalido.' }, { status: 400 })
  }

  const parsed = peticionAsistenteSchema.safeParse(cuerpo)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' }, { status: 400 })
  }
  const { mensaje, historial } = parsed.data

  let fragmentos: Awaited<ReturnType<typeof buscarFragmentos>> = []
  try {
    fragmentos = await buscarFragmentos(mensaje, CANTIDAD_FRAGMENTOS_RAG)
  } catch (err) {
    console.error('[asistente] error buscando fragmentos RAG:', err)
    // Sigue sin contexto tecnico: el prompt de sistema ya indica que sin
    // manuales no debe inventar sobre rehabilitacion.
  }

  const mensajes: MensajeChat[] = [
    { role: 'system', content: obtenerPromptSistema() },
    { role: 'system', content: construirContextoRag(fragmentos) },
    { role: 'system', content: INSTRUCCIONES_FORMATO_CHAT },
    ...historial,
    { role: 'user', content: mensaje },
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const trozo of generarRespuestaStreaming(mensajes)) {
          controller.enqueue(encoder.encode(trozo))
        }
      } catch (err) {
        console.error('[asistente] error generando respuesta con Groq:', err)
        controller.enqueue(
          encoder.encode('\n\n[No pude generar una respuesta en este momento. Intenta de nuevo en unos minutos.]')
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

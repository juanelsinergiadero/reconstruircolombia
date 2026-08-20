'use client'

import { useEffect, useRef, useState } from 'react'
import { LONGITUD_MAXIMA_MENSAJE } from '@/lib/validations/asistente'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

// Cuantos mensajes previos se mandan como historial en cada peticion:
// coincide con el maximo que acepta la API (ver lib/validations/asistente.ts)
// para no mandar algo que el servidor va a rechazar.
const MAXIMO_HISTORIAL_ENVIADO = 12

export function AsistenteChat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [entrada, setEntrada] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviarMensaje(texto: string) {
    if (!texto || enviando) return

    setError(null)
    setEntrada('')
    const historialParaEnviar = mensajes.slice(-MAXIMO_HISTORIAL_ENVIADO)
    setMensajes((prev) => [...prev, { role: 'user', content: texto }, { role: 'assistant', content: '' }])
    setEnviando(true)

    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto, historial: historialParaEnviar }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo contactar al asistente.')
      }

      const lector = res.body.getReader()
      const decodificador = new TextDecoder()

      while (true) {
        const { done, value } = await lector.read()
        if (done) break
        const trozo = decodificador.decode(value, { stream: true })
        setMensajes((prev) => {
          const copia = [...prev]
          const ultimo = copia[copia.length - 1]
          copia[copia.length - 1] = { ...ultimo, content: ultimo.content + trozo }
          return copia
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrio un error inesperado. Intenta de nuevo.')
      // Se conserva el mensaje del usuario (para que sepa que pregunto) y se
      // quita solo el placeholder de respuesta que quedo vacio.
      setMensajes((prev) => prev.slice(0, -1))
    } finally {
      setEnviando(false)
    }
  }

  function alEnviarFormulario(e: React.FormEvent) {
    e.preventDefault()
    void enviarMensaje(entrada.trim())
  }

  function alPresionarTecla(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void enviarMensaje(entrada.trim())
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-acento bg-[#8a34230d] px-4 py-3 text-center text-sm text-zinc-700 sm:px-6">
        Este es un asistente automático (inteligencia artificial) en fase de prueba. Puede
        cometer errores y no reemplaza la evaluación de un profesional.{' '}
        <strong className="font-semibold text-acento">
          Si hay riesgo para tu vida, llama ya a la Línea de Emergencias 123.
        </strong>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6">
        <div className="flex-1 overflow-y-auto py-6">
          {mensajes.length === 0 && (
            <p className="text-sm text-zinc-500">
              Preguntame sobre reconstruircolombia o sobre rehabilitación de vivienda en adobe,
              tapia pisada o mampostería.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {mensajes.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900'
                      : 'max-w-[85%] text-sm leading-relaxed text-zinc-900'
                  }
                >
                  {m.role === 'assistant' && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-acento">
                      Asistente
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">
                    {m.content || (enviando && i === mensajes.length - 1 ? 'Escribiendo…' : '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div ref={finRef} />
        </div>

        {error && (
          <p className="mb-2 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={alEnviarFormulario} className="flex gap-2 border-t border-zinc-200 bg-white py-4">
          <textarea
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={alPresionarTecla}
            maxLength={LONGITUD_MAXIMA_MENSAJE}
            rows={1}
            placeholder="Escribe tu pregunta..."
            disabled={enviando}
            className="flex-1 resize-none border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-acento focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={enviando || !entrada.trim()}
            className="border border-acento bg-acento px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-acento-oscuro disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}

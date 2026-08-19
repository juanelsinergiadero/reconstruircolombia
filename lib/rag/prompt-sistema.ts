// Carga el prompt de sistema del asistente desde prompt-sistema.md. Vive
// como texto (no como codigo) para poder revisarlo/editarlo sin tocar
// TypeScript, y para que quede claro que su contenido es el nucleo de
// seguridad del asistente: no se genera ni se modifica desde aqui, solo se
// lee tal cual.

import { readFileSync } from 'node:fs'
import path from 'node:path'

let promptCacheado: string | null = null

export function obtenerPromptSistema(): string {
  if (promptCacheado === null) {
    promptCacheado = readFileSync(path.join(process.cwd(), 'lib/rag/prompt-sistema.md'), 'utf-8')
  }
  return promptCacheado
}

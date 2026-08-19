// Rate limiting en memoria por IP para el endpoint del asistente. Suficiente
// para el despliegue actual (un solo proceso Node); si se escala a mas de
// una instancia esto deja de ser un limite global y habria que moverlo a
// Postgres o Redis.

const LIMITE_POR_MINUTO = 6
const LIMITE_POR_HORA = 40
const VENTANA_MINUTO_MS = 60 * 1000
const VENTANA_HORA_MS = 60 * 60 * 1000

// Sin esto el mapa crece sin limite mientras el proceso viva. No hace falta
// precision: cada tanto se recorren las IPs y se botan las que ya no tienen
// peticiones recientes.
const INTERVALO_LIMPIEZA = 500
let peticionesDesdeLimpieza = 0

const peticionesPorIp = new Map<string, number[]>()

export interface ResultadoLimite {
  permitido: boolean
  reintentarEnSegundos?: number
}

function limpiarIpsInactivas(ahora: number) {
  for (const [ip, marcas] of peticionesPorIp) {
    if (marcas.every((t) => ahora - t >= VENTANA_HORA_MS)) peticionesPorIp.delete(ip)
  }
}

export function verificarLimiteDeTasa(ip: string): ResultadoLimite {
  const ahora = Date.now()

  peticionesDesdeLimpieza++
  if (peticionesDesdeLimpieza >= INTERVALO_LIMPIEZA) {
    peticionesDesdeLimpieza = 0
    limpiarIpsInactivas(ahora)
  }

  const marcas = (peticionesPorIp.get(ip) ?? []).filter((t) => ahora - t < VENTANA_HORA_MS)

  const enUltimoMinuto = marcas.filter((t) => ahora - t < VENTANA_MINUTO_MS).length
  if (enUltimoMinuto >= LIMITE_POR_MINUTO) {
    peticionesPorIp.set(ip, marcas)
    return { permitido: false, reintentarEnSegundos: 60 }
  }
  if (marcas.length >= LIMITE_POR_HORA) {
    peticionesPorIp.set(ip, marcas)
    return { permitido: false, reintentarEnSegundos: 3600 }
  }

  marcas.push(ahora)
  peticionesPorIp.set(ip, marcas)
  return { permitido: true }
}

// La app corre detras de un proxy (ver docker-compose); x-forwarded-for /
// x-real-ip son los que trae. Sin proxy confiable no hay forma robusta de
// distinguir IPs, asi que se cae a una clave fija (limite compartido) antes
// que reventar.
export function obtenerIpDeRequest(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()

  return 'desconocida'
}

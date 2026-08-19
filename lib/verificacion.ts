import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { enviarCorreo } from '@/lib/email'
import { getBaseUrl } from '@/lib/url'

const TTL_HORAS = 24

// Crea un token de un solo uso y envia el correo de verificacion. Nunca
// bloquea el flujo que lo llama (enviarCorreo ya no lanza; los errores de
// BD se dejan subir para que quien llama decida si los ignora).
//
// Cualquier token previo sin consumir se descarta: solo el ultimo enlace
// enviado es valido, para no acumular tokens huerfanos por reenvios.
export async function crearYEnviarVerificacion(
  userId: string,
  email: string,
  nombre: string | null
): Promise<{ ok: boolean }> {
  await prisma.tokenVerificacion.deleteMany({ where: { userId } })

  const token = randomBytes(32).toString('hex')
  const expira = new Date(Date.now() + TTL_HORAS * 60 * 60 * 1000)

  await prisma.tokenVerificacion.create({ data: { token, userId, expira } })

  const enlace = `${getBaseUrl()}/verificar?token=${token}`
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,'

  return enviarCorreo({
    para: email,
    asunto: 'Verifica tu correo — reconstruircolombia',
    html: `<p>${saludo}</p><p>Puedes confirmar tu correo para sumar confianza a tus reportes en reconstruircolombia. Esto es opcional: la plataforma funciona igual sin verificarlo.</p><p><a href="${enlace}">Verificar mi correo</a></p><p>Este enlace expira en ${TTL_HORAS} horas.</p>`,
    texto: `${saludo} Confirma tu correo en reconstruircolombia (opcional, no es requisito para usar la plataforma): ${enlace} — expira en ${TTL_HORAS} horas.`,
  })
}

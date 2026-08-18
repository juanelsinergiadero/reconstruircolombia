import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

const REMITENTE = new Sender('no-responder@reconstruircolombia.org', 'reconstruircolombia')

let mailerSend: MailerSend | null = null

function obtenerCliente(): MailerSend | null {
  const apiKey = process.env.MAILERSEND_API_KEY

  if (!apiKey) {
    console.error('[email] Falta MAILERSEND_API_KEY en el entorno.')
    return null
  }

  if (!mailerSend) {
    mailerSend = new MailerSend({ apiKey })
  }

  return mailerSend
}

interface EnviarCorreoParams {
  para: string
  asunto: string
  html: string
  texto: string
}

export async function enviarCorreo({ para, asunto, html, texto }: EnviarCorreoParams): Promise<{ ok: boolean }> {
  const cliente = obtenerCliente()

  if (!cliente) {
    return { ok: false }
  }

  try {
    const params = new EmailParams()
      .setFrom(REMITENTE)
      .setTo([new Recipient(para)])
      .setSubject(asunto)
      .setHtml(html)
      .setText(texto)

    await cliente.email.send(params)

    return { ok: true }
  } catch (error) {
    console.error('[email] Error al enviar correo:', error)
    return { ok: false }
  }
}

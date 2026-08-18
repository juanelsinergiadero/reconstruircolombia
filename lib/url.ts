// Sanea un callbackUrl que llega desde un search param o un input oculto
// de formulario, antes de pasarlo a signIn({ redirectTo }) o a redirect().
// Solo se aceptan rutas relativas al propio sitio: bloquea URLs absolutas
// ("https://evil.com") y protocol-relative ("//evil.com") que redirigirian
// fuera de la aplicacion (open redirect).
export function rutaCallbackSegura(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return '/'
  return url
}

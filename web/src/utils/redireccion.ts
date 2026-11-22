/**
 * Valida el `?redirect=` del login. Solo acepta rutas internas: sin esto, un link como
 * `/login?redirect=//sitio-malicioso.com` mandaría al usuario a otro sitio justo después de entrar.
 */
export function rutaInternaSegura(valor: unknown, porDefecto = '/'): string {
  const ruta = Array.isArray(valor) ? valor[0] : valor
  if (typeof ruta !== 'string') return porDefecto
  // "//host" y "/\host" los interpreta el navegador como otro origen.
  if (!ruta.startsWith('/') || ruta.startsWith('//') || ruta.startsWith('/\\')) return porDefecto
  return ruta
}

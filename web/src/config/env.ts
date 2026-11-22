/**
 * Único archivo que lee `import.meta.env`. El resto de la app importa `env`.
 * Falla al arrancar con un mensaje claro si falta una variable requerida.
 */

function requireEnv(nombre: keyof ImportMetaEnv): string {
  const valor = import.meta.env[nombre]
  if (typeof valor !== 'string' || valor === '') {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa web/.env.example`)
  }
  return valor
}

export const env = {
  apiUrl: requireEnv('VITE_API_URL'),
  usarMocks: import.meta.env.VITE_USE_MOCKS === 'true',
} as const

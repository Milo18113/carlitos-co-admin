import { describe, expect, it } from 'vitest'

import { rutaInternaSegura } from '@/utils/redireccion'

describe('rutaInternaSegura', () => {
  it('acepta una ruta interna con su query', () => {
    expect(rutaInternaSegura('/pagos?factura=001-001-000000102')).toBe(
      '/pagos?factura=001-001-000000102',
    )
  })

  it('usa la ruta por defecto si no hay redirect', () => {
    expect(rutaInternaSegura(undefined)).toBe('/')
    expect(rutaInternaSegura(null)).toBe('/')
  })

  it('rechaza una URL de otro sitio', () => {
    expect(rutaInternaSegura('https://sitio-malicioso.example')).toBe('/')
  })

  it('rechaza las rutas que el navegador interpreta como otro origen', () => {
    expect(rutaInternaSegura('//sitio-malicioso.example')).toBe('/')
    expect(rutaInternaSegura('/\\sitio-malicioso.example')).toBe('/')
  })

  it('si el query trae el parámetro repetido toma el primero', () => {
    expect(rutaInternaSegura(['/clientes', '/pagos'])).toBe('/clientes')
  })
})

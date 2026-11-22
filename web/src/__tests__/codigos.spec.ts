import { describe, expect, it } from 'vitest'

import { sugerirCodigo } from '@/utils/codigos'

describe('sugerirCodigo', () => {
  it('arma prefijo, fecha y hora hasta el segundo', () => {
    expect(sugerirCodigo('PAG', new Date(2026, 10, 22, 13, 5, 9))).toBe('PAG-20261122-130509')
  })

  it('rellena con ceros el mes, el día y la hora', () => {
    expect(sugerirCodigo('PAG', new Date(2026, 0, 3, 4, 5, 6))).toBe('PAG-20260103-040506')
  })

  it('dos pagos del mismo día en segundos distintos no chocan', () => {
    const a = sugerirCodigo('PAG', new Date(2026, 10, 22, 13, 5, 9))
    const b = sugerirCodigo('PAG', new Date(2026, 10, 22, 13, 5, 10))

    expect(a).not.toBe(b)
  })

  it('usa el momento actual si no se le pasa uno', () => {
    expect(sugerirCodigo('E')).toMatch(/^E-\d{8}-\d{6}$/)
  })
})

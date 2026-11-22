import { describe, expect, it } from 'vitest'

import { esNumerico, formatearCelda, SIN_DATO } from '@/utils/formatoCelda'
import { formatearFecha, formatearFechaHora } from '@/utils/fecha'
import { formatearEntero, formatearMoneda } from '@/utils/moneda'

describe('formatearMoneda', () => {
  it('usa punto de miles, coma decimal y dos decimales', () => {
    expect(formatearMoneda(1240)).toBe('$ 1.240,00')
    expect(formatearMoneda(592.35)).toBe('$ 592,35')
    expect(formatearMoneda(1234567.891)).toBe('$ 1.234.567,89')
  })

  it('escribe el cero y los montos chicos sin perder los decimales', () => {
    expect(formatearMoneda(0)).toBe('$ 0,00')
    expect(formatearMoneda(0.5)).toBe('$ 0,50')
  })

  it('pone el signo menos delante de todo', () => {
    expect(formatearMoneda(-12.5)).toBe('-$ 12,50')
  })

  it('no deja un "-$ 0,00" cuando el valor se redondea a cero', () => {
    expect(formatearMoneda(-0.001)).toBe('$ 0,00')
  })
})

describe('formatearEntero', () => {
  it('agrupa los miles con punto', () => {
    expect(formatearEntero(1284)).toBe('1.284')
    expect(formatearEntero(35)).toBe('35')
    expect(formatearEntero(1000000)).toBe('1.000.000')
  })
})

describe('formatearFecha', () => {
  it('escribe la fecha como "18 nov 2026" sin correrla de día por la zona horaria', () => {
    expect(formatearFecha('2026-11-18')).toBe('18 nov 2026')
    expect(formatearFecha('2026-01-01')).toBe('01 ene 2026')
  })

  it('devuelve el texto tal cual si no es una fecha', () => {
    expect(formatearFecha('no es fecha')).toBe('no es fecha')
  })

  it('arma la fecha y hora de generación de un PDF', () => {
    expect(formatearFechaHora(new Date(2026, 10, 22, 13, 5))).toBe('22 nov 2026, 13:05')
  })
})

describe('formatearCelda', () => {
  it('aplica el formato de la columna', () => {
    expect(formatearCelda(1240, 'moneda')).toBe('$ 1.240,00')
    expect(formatearCelda(1284, 'numero')).toBe('1.284')
    expect(formatearCelda('2026-11-18', 'fecha')).toBe('18 nov 2026')
    expect(formatearCelda('Hilux', 'texto')).toBe('Hilux')
  })

  it('muestra una raya cuando no hay dato', () => {
    expect(formatearCelda(null, 'texto')).toBe(SIN_DATO)
    expect(formatearCelda(undefined, 'moneda')).toBe(SIN_DATO)
    expect(formatearCelda('', 'texto')).toBe(SIN_DATO)
  })

  it('conserva el cero: es un dato, no una ausencia', () => {
    expect(formatearCelda(0, 'moneda')).toBe('$ 0,00')
    expect(formatearCelda(0, 'numero')).toBe('0')
  })

  it('solo alinea a la derecha moneda y número', () => {
    expect(esNumerico('moneda')).toBe(true)
    expect(esNumerico('numero')).toBe(true)
    expect(esNumerico('fecha')).toBe(false)
    expect(esNumerico(undefined)).toBe(false)
  })
})

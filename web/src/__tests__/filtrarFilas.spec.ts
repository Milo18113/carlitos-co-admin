import { describe, expect, it } from 'vitest'

import type { ColumnaTabla } from '@/types/tabla'
import { filtrarFilas } from '@/utils/filtrarFilas'

interface Fila {
  nombre: string
  total: number
  fecha: string
  activo: 0 | 1
}

const columnas: ColumnaTabla<Fila>[] = [
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'total', etiqueta: 'Total', formato: 'moneda' },
  { clave: 'fecha', etiqueta: 'Fecha', formato: 'fecha' },
  { clave: 'activo', etiqueta: 'Estado', formato: 'activo' },
]

const filas: Fila[] = [
  { nombre: 'MECÁNICA DIESEL', total: 1240, fecha: '2026-11-18', activo: 1 },
  { nombre: 'FLOTA QUITUMBE', total: 3865.5, fecha: '2026-10-02', activo: 0 },
]

describe('filtrarFilas', () => {
  it('sin consulta devuelve las mismas filas', () => {
    expect(filtrarFilas(filas, columnas, '')).toBe(filas)
    expect(filtrarFilas(filas, columnas, '   ')).toBe(filas)
  })

  it('ignora mayúsculas y tildes', () => {
    expect(filtrarFilas(filas, columnas, 'mecanica')).toEqual([filas[0]])
    expect(filtrarFilas(filas, columnas, 'QUITUMBE')).toEqual([filas[1]])
  })

  it('busca en lo que se ve, no en el dato crudo', () => {
    // "3.865,50" es como se muestra; el dato crudo es 3865.5.
    expect(filtrarFilas(filas, columnas, '3.865')).toEqual([filas[1]])
    expect(filtrarFilas(filas, columnas, 'nov 2026')).toEqual([filas[0]])
    expect(filtrarFilas(filas, columnas, 'inactivo')).toEqual([filas[1]])
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(filtrarFilas(filas, columnas, 'zzz')).toEqual([])
  })
})

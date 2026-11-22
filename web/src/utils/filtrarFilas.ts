import type { ColumnaTabla } from '@/types/tabla'

import { formatearCelda } from './formatoCelda'

/** Sin mayúsculas ni tildes: buscar "mecanica" encuentra "MECÁNICA". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Las filas cuyo texto (tal como se ve en la tabla: "$ 1.240,00", "18 nov 2026") contiene la
 * consulta. Lo usan `DataTable` y el PDF, para que el reporte exportado sea lo que se ve en pantalla.
 */
export function filtrarFilas<T extends object>(
  filas: T[],
  columnas: ColumnaTabla<T>[],
  consulta: string,
): T[] {
  const buscada = normalizar(consulta.trim())
  if (buscada === '') return filas
  return filas.filter((fila) => {
    const texto = columnas
      // Una columna de botones no tiene texto que buscar.
      .filter((columna) => !columna.acciones)
      .map((columna) => formatearCelda(fila[columna.clave], columna.formato))
      .join(' ')
    return normalizar(texto).includes(buscada)
  })
}

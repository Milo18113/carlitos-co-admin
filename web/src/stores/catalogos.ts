import { defineStore } from 'pinia'

import { catalogosService } from '@/services'
import type { CatalogosPorNombre, NombreCatalogo } from '@/types/catalogo'

import { crearCargadorPorClave } from './cargadorPorClave'

/**
 * Los catálogos de los `<select>` (marcas, categorías, bodegas, ciudades, tipos de identificación,
 * formas de pago, roles). Se piden una vez y se comparten entre todos los formularios (plan 5.3).
 */
export const useCatalogosStore = defineStore('catalogos', () => {
  const cargador = crearCargadorPorClave<CatalogosPorNombre>((nombre) =>
    catalogosService.obtener(nombre),
  )

  /** Pide varios a la vez; los que ya están en la caché no se vuelven a pedir. */
  async function cargarVarios(nombres: NombreCatalogo[]): Promise<void> {
    await Promise.all(nombres.map((nombre) => cargador.cargar(nombre)))
  }

  return {
    itemsDe: cargador.valorDe,
    estaCargando: cargador.estaCargando,
    errorDe: cargador.errorDe,
    cargar: cargador.cargar,
    cargarVarios,
  }
})

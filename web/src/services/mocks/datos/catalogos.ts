import { ROL_ADMINISTRADOR, ROL_VENDEDOR } from '@/config/roles'
import type { CatalogosPorNombre } from '@/types/catalogo'
import { TIPO_IDENTIFICACION } from '@/types/cliente'

/** Catálogos de `GET /api/catalogos/:nombre`. Los códigos son los que usan las demás fixtures. */
export const CATALOGOS_BASE: CatalogosPorNombre = {
  marcas: [
    { codigo: 'TOY', nombre: 'Toyota' },
    { codigo: 'CHV', nombre: 'Chevrolet' },
    { codigo: 'HYU', nombre: 'Hyundai' },
    { codigo: 'KIA', nombre: 'Kia' },
    { codigo: 'NIS', nombre: 'Nissan' },
    { codigo: 'BOS', nombre: 'Bosch' },
    { codigo: 'MON', nombre: 'Monroe' },
    { codigo: 'GAT', nombre: 'Gates' },
    { codigo: 'NGK', nombre: 'NGK' },
    { codigo: 'MTC', nombre: 'Motorcraft' },
    { codigo: 'BRE', nombre: 'Brembo' },
    { codigo: 'DEN', nombre: 'Denso' },
  ],
  categorias: [
    { codigo: 'FRE', nombre: 'Frenos' },
    { codigo: 'SUS', nombre: 'Suspensión' },
    { codigo: 'MOT', nombre: 'Motor' },
    { codigo: 'ELE', nombre: 'Sistema eléctrico' },
    { codigo: 'FIL', nombre: 'Filtros' },
    { codigo: 'ENC', nombre: 'Encendido' },
    { codigo: 'TRA', nombre: 'Transmisión' },
    { codigo: 'REF', nombre: 'Refrigeración' },
  ],
  // `tBodega.direccion` es VARCHAR(45): las direcciones respetan ese largo.
  bodegas: [
    { codigo: 'B1', nombre: 'Bodega Central' },
    { codigo: 'B2', nombre: 'Bodega Norte' },
    { codigo: 'B3', nombre: 'Bodega Valle' },
    { codigo: 'B4', nombre: 'Bodega Guayaquil' },
    { codigo: 'B5', nombre: 'Bodega Cuenca' },
  ],
  ciudades: [
    { codigo: 'UIO', nombre: 'Quito' },
    { codigo: 'GYE', nombre: 'Guayaquil' },
    { codigo: 'CUE', nombre: 'Cuenca' },
    { codigo: 'AMB', nombre: 'Ambato' },
    { codigo: 'MAN', nombre: 'Manta' },
    { codigo: 'LOJ', nombre: 'Loja' },
    { codigo: 'IBA', nombre: 'Ibarra' },
    { codigo: 'STO', nombre: 'Santo Domingo' },
  ],
  'tipos-identificacion': [
    { codigo: TIPO_IDENTIFICACION.RUC, nombre: 'RUC' },
    { codigo: TIPO_IDENTIFICACION.CEDULA, nombre: 'Cédula' },
    { codigo: TIPO_IDENTIFICACION.CONSUMIDOR_FINAL, nombre: 'Consumidor final' },
  ],
  'formas-pago': [
    { codigo: '01', nombre: 'Efectivo' },
    { codigo: '16', nombre: 'Tarjeta de débito' },
    { codigo: '19', nombre: 'Tarjeta de crédito' },
    { codigo: '20', nombre: 'Transferencia' },
  ],
  roles: [
    { codigo: ROL_ADMINISTRADOR, nombre: 'Administrador' },
    { codigo: ROL_VENDEDOR, nombre: 'Vendedor' },
  ],
}

/** Direcciones de `tBodega`, que el catálogo no expone pero la vista `Bodegas_Disponibles` sí. */
export const DIRECCIONES_BODEGA: Readonly<Record<string, string>> = {
  B1: 'Av. 10 de Agosto N34-120, Quito',
  B2: 'Av. De la Prensa N58-210, Quito',
  B3: 'Av. General Enríquez 1450, Sangolquí',
  B4: 'Av. Juan Tanca Marengo km 3, Guayaquil',
  B5: 'Av. de las Américas 2-45, Cuenca',
}

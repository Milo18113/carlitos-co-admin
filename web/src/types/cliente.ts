/** Códigos de `tTipoIdentificacion` del modelo. */
export const TIPO_IDENTIFICACION = {
  RUC: '04',
  CEDULA: '05',
  CONSUMIDOR_FINAL: '07',
} as const

/** Fila de `GET /api/clientes`: columnas de `tCliente` (schema.sql), sin renombrar. */
export interface Cliente {
  numero_identificacion: string
  razon_social: string
  telefono: string | null
  email: string | null
  direccion: string | null
  fecha_registro: string
  fecha_modificacion: string | null
  tTipoIdentificacion_codigo_tipo_identificacion: string
  tCiudad_codigo_ciudad: string | null
}

/** Body de `POST /api/clientes` → `registrar_cliente`. Los opcionales van como `null`, nunca `undefined`. */
export interface ClienteNuevo {
  numero_identificacion: string
  codigo_tipo: string
  razon_social: string
  telefono: string | null
  email: string | null
  direccion: string | null
  codigo_ciudad: string | null
}

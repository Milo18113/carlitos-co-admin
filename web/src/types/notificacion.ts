export type TipoNotificacion = 'exito' | 'error' | 'info'

export interface Notificacion {
  id: number
  tipo: TipoNotificacion
  titulo: string
  /** Detalle debajo del título; para una escritura es el `mensaje` del procedure. */
  texto?: string
}

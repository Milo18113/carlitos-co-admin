export interface ItemNavegacion {
  etiqueta: string
  /** Nombre en Bootstrap Icons, sin el prefijo `bi-`. */
  icono: string
  ruta: string
  /** Si está, solo lo ve (y puede abrir) ese rol. */
  rolRequerido?: number
}

export interface GrupoNavegacion {
  /** Rótulo del grupo; el primer grupo no lleva. */
  titulo?: string
  items: ItemNavegacion[]
}

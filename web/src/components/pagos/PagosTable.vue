<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { ItemCatalogo } from '@/types/catalogo'
import type { Pago } from '@/types/pago'
import type { ColumnaTabla } from '@/types/tabla'

/** Lo que muestra la tabla: el pago con la forma de pago por nombre. */
interface FilaPago {
  codigo_pago: string
  fecha: string
  factura: string
  forma: string
  referencia: string | null
  monto: number
  acciones: null
}

const props = defineProps<{
  pagos: Pago[]
  /** Para mostrar la forma de pago por nombre y no por código. */
  formasPago: ItemCatalogo[]
  cargando?: boolean
}>()

/** `v-model:filtro`: la view lo guarda en la URL (`?q=`). */
const filtro = defineModel<string>('filtro', { default: '' })

const emit = defineEmits<{
  /** El botón de eliminar de una fila. Quien escucha tiene que confirmar antes de borrar nada. */
  eliminar: [codigo: string]
}>()

const columnas: ColumnaTabla<FilaPago>[] = [
  { clave: 'codigo_pago', etiqueta: 'Pago', principal: true },
  { clave: 'fecha', etiqueta: 'Fecha', formato: 'fecha' },
  { clave: 'factura', etiqueta: 'Factura', sinSaltos: true },
  { clave: 'forma', etiqueta: 'Forma de pago', sinSaltos: true },
  { clave: 'referencia', etiqueta: 'Referencia', sinSaltos: true },
  { clave: 'monto', etiqueta: 'Monto', formato: 'moneda' },
  { clave: 'acciones', etiqueta: 'Acciones', acciones: true },
]

// Los más recientes primero: lo que se acaba de registrar (y todavía se puede eliminar) queda arriba.
const filas = computed<FilaPago[]>(() =>
  [...props.pagos]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.codigo_pago.localeCompare(a.codigo_pago))
    .map((pago) => ({
      codigo_pago: pago.codigo_pago,
      fecha: pago.fecha,
      factura: pago.tFactura_numero_factura,
      // Mientras el catálogo no llega se muestra el código: la tabla no espera por él.
      forma:
        props.formasPago.find((forma) => forma.codigo === pago.tFormaPago_codigo_forma_pago)
          ?.nombre ?? pago.tFormaPago_codigo_forma_pago,
      referencia: pago.referencia,
      monto: pago.monto,
      acciones: null,
    })),
)
</script>

<template>
  <DataTable
    v-model:filtro="filtro"
    titulo="Pagos"
    :columnas="columnas"
    :filas="filas"
    :cargando="cargando"
    :clave-fila="(fila) => fila.codigo_pago"
  >
    <template #celda-acciones="{ fila }">
      <!-- Eliminar siempre pasa por un ConfirmDialog: este botón solo avisa (`eliminar`) -->
      <button
        type="button"
        class="btn btn-neutral btn-icon btn-sm text-danger"
        :aria-label="`Eliminar el pago ${fila.codigo_pago}`"
        :title="`Eliminar el pago ${fila.codigo_pago}`"
        @click="emit('eliminar', fila.codigo_pago)"
      >
        <AppIcon nombre="trash" />
      </button>
    </template>

    <template #vacio>
      <EmptyState
        icono="credit-card"
        titulo="Todavía no hay pagos"
        texto="Los pagos que registres van a aparecer aquí."
      />
    </template>
  </DataTable>
</template>

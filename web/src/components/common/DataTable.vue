<script setup lang="ts" generic="T extends object">
import { computed } from 'vue'

import type { ColumnaTabla } from '@/types/tabla'
import { filtrarFilas } from '@/utils/filtrarFilas'
import { esNumerico, estaActivo, formatearCelda } from '@/utils/formatoCelda'

import AppIcon from './AppIcon.vue'
import EmptyState from './EmptyState.vue'

const props = withDefaults(
  defineProps<{
    /** Columnas, en el orden en que se muestran. */
    columnas: ColumnaTabla<T>[]
    /** Todas las filas; el filtro se aplica aquí adentro. */
    filas: T[]
    /** Muestra filas de carga (skeleton) en vez de los datos. */
    cargando?: boolean
    /** Clave única de cada fila. Si no se pasa se usa la posición. */
    claveFila?: (fila: T) => string | number
    /** Nombre accesible de la tabla (se lee con lector de pantalla, no se ve). */
    titulo?: string
    /** Muestra el buscador sobre la tabla. */
    filtrable?: boolean
    /** Las filas se pueden activar con clic o Enter y emiten `seleccionar`. */
    seleccionable?: boolean
    /** Texto del estado vacío cuando no hay ninguna fila. */
    textoVacio?: string
  }>(),
  { filtrable: true, textoVacio: 'Todavía no hay registros para mostrar.' },
)

/** `v-model:filtro`: el padre puede guardarlo en la URL; sin padre, la tabla lo maneja sola. */
const filtro = defineModel<string>('filtro', { default: '' })

const emit = defineEmits<{
  /** Se activó una fila (solo con `seleccionable`). */
  seleccionar: [fila: T]
}>()

defineSlots<{
  /** Estado vacío a medida; si no se pasa, se usa uno por defecto. */
  vacio?: () => unknown
  /** Una celda a medida por columna: `#celda-<clave>`. Sin esto se usa el formato de la columna. */
  [celda: `celda-${string}`]: (props: { fila: T; valor: unknown }) => unknown
}>()

const filasVisibles = computed(() => filtrarFilas(props.filas, props.columnas, filtro.value))

const hayFiltro = computed(() => filtro.value.trim() !== '')
const sinFilas = computed(() => !props.cargando && props.filas.length === 0)
const sinCoincidencias = computed(
  () => !props.cargando && props.filas.length > 0 && filasVisibles.value.length === 0,
)

function activar(fila: T): void {
  if (props.seleccionable) emit('seleccionar', fila)
}
</script>

<template>
  <div class="cc-table-wrap" :aria-busy="cargando">
    <div v-if="filtrable" class="d-flex align-items-center gap-2 p-3 border-bottom">
      <div class="cc-search">
        <AppIcon nombre="search" />
        <input
          v-model="filtro"
          type="search"
          class="form-control"
          placeholder="Buscar"
          :aria-label="`Buscar en ${titulo ?? 'la tabla'}`"
        />
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <caption v-if="titulo" class="visually-hidden">
          {{
            titulo
          }}
        </caption>
        <thead>
          <tr>
            <th
              v-for="columna in columnas"
              :key="columna.clave"
              scope="col"
              :class="{ 'text-end': esNumerico(columna.formato) || columna.acciones }"
            >
              <!-- Una columna de botones no necesita encabezado a la vista, pero sí para el lector de pantalla -->
              <span :class="{ 'visually-hidden': columna.acciones }">{{ columna.etiqueta }}</span>
            </th>
          </tr>
        </thead>

        <tbody v-if="cargando">
          <tr v-for="n in 5" :key="n" aria-hidden="true">
            <td v-for="columna in columnas" :key="columna.clave">
              <span class="placeholder-glow d-block">
                <span class="placeholder col-8"></span>
              </span>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr
            v-for="(fila, indice) in filasVisibles"
            :key="claveFila ? claveFila(fila) : indice"
            :class="{ 'cc-row-selectable': seleccionable }"
            :tabindex="seleccionable ? 0 : undefined"
            @click="activar(fila)"
            @keydown.enter="activar(fila)"
          >
            <td
              v-for="columna in columnas"
              :key="columna.clave"
              :class="{
                'text-end tabular': esNumerico(columna.formato),
                'text-end': columna.acciones,
                'text-nowrap': columna.sinSaltos || columna.formato === 'fecha',
                'cc-cell-main': columna.principal,
              }"
            >
              <slot :name="`celda-${columna.clave}`" :fila="fila" :valor="fila[columna.clave]">
                <!-- Estado activo/inactivo: el color va siempre con ícono y texto -->
                <span
                  v-if="columna.formato === 'activo'"
                  :class="[
                    'badge',
                    estaActivo(fila[columna.clave])
                      ? 'bg-success-subtle text-success-emphasis'
                      : 'bg-secondary-subtle text-secondary-emphasis',
                  ]"
                >
                  <AppIcon
                    :nombre="estaActivo(fila[columna.clave]) ? 'check-circle' : 'dash-circle'"
                  />
                  {{ formatearCelda(fila[columna.clave], columna.formato) }}
                </span>
                <template v-else>
                  {{ formatearCelda(fila[columna.clave], columna.formato) }}
                </template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <slot v-if="sinFilas" name="vacio">
      <EmptyState titulo="Sin registros" :texto="textoVacio" />
    </slot>

    <EmptyState
      v-else-if="sinCoincidencias"
      icono="search"
      titulo="Sin resultados"
      :texto="`Ninguna fila coincide con «${filtro.trim()}».`"
    >
      <button type="button" class="btn btn-neutral" @click="filtro = ''">Limpiar búsqueda</button>
    </EmptyState>

    <div v-if="!cargando && filas.length > 0" class="cc-table-foot">
      <span>
        Mostrando {{ filasVisibles.length }} de {{ filas.length }}
        {{ filas.length === 1 ? 'registro' : 'registros' }}
        <template v-if="hayFiltro"> (filtrado)</template>
      </span>
    </div>
  </div>
</template>

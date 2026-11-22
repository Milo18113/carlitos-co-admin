<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorDeCarga from '@/components/common/ErrorDeCarga.vue'
import SidePanel from '@/components/common/SidePanel.vue'
import RepuestoForm from '@/components/repuestos/RepuestoForm.vue'
import TrasladoForm from '@/components/repuestos/TrasladoForm.vue'
import { useFiltroUrl } from '@/composables/useFiltroUrl'
import { useCatalogosStore } from '@/stores/catalogos'
import { useReportesStore } from '@/stores/reportes'
import { useRepuestosStore } from '@/stores/repuestos'
import type { ItemCatalogo } from '@/types/catalogo'
import type { CatalogosRepuesto, RepuestoNuevo, TrasladoNuevo } from '@/types/repuesto'
import type { ColumnaTabla } from '@/types/tabla'

type EstadoStock = 'sin-stock' | 'bajo' | 'disponible'

/** Lo que muestra la tabla: el producto con marca y categoría por nombre, y su stock total. */
interface FilaRepuesto {
  codigo_oe: string
  descripcion: string
  marca: string
  categoria: string
  precio_venta: number
  stock_minimo: number
  /** Suma de todas las bodegas; `null` mientras no llega el reporte de stock. */
  stock: number | null
  estado: EstadoStock | null
  acciones: null
}

type Panel = 'cerrado' | 'ingreso' | 'traslado'

const repuestos = useRepuestosStore()
const catalogos = useCatalogosStore()
const reportes = useReportesStore()

const filtro = useFiltroUrl()

onMounted(() => {
  void repuestos.cargar()
  // El stock por bodega sale del reporte `repuestos-disponibles` (la misma caché del dashboard).
  void reportes.cargar('repuestos-disponibles')
  void catalogos.cargarVarios(['marcas', 'categorias', 'bodegas'])
})

// --- Tabla ---
const columnas: ColumnaTabla<FilaRepuesto>[] = [
  { clave: 'codigo_oe', etiqueta: 'Código OE', principal: true },
  { clave: 'descripcion', etiqueta: 'Descripción' },
  { clave: 'marca', etiqueta: 'Marca' },
  { clave: 'categoria', etiqueta: 'Categoría' },
  { clave: 'precio_venta', etiqueta: 'Precio', formato: 'moneda' },
  { clave: 'stock_minimo', etiqueta: 'Stock mínimo', formato: 'numero' },
  { clave: 'stock', etiqueta: 'Stock', formato: 'numero' },
  { clave: 'estado', etiqueta: 'Estado' },
  { clave: 'acciones', etiqueta: 'Acciones', acciones: true },
]

function nombreDe(items: ItemCatalogo[] | undefined, codigo: string): string {
  // Mientras el catálogo no llega se muestra el código: la tabla no espera por él.
  return items?.find((item) => item.codigo === codigo)?.nombre ?? codigo
}

/** Unidades de cada repuesto sumando todas las bodegas. */
const stockPorRepuesto = computed(() => {
  const disponibles = reportes.filasDe('repuestos-disponibles')
  if (!disponibles) return null
  const total = new Map<string, number>()
  for (const fila of disponibles) {
    total.set(fila.Codigo_oe, (total.get(fila.Codigo_oe) ?? 0) + fila.cantidad)
  }
  return total
})

function estadoDe(stock: number, minimo: number): EstadoStock {
  if (stock === 0) return 'sin-stock'
  return stock < minimo ? 'bajo' : 'disponible'
}

const filas = computed<FilaRepuesto[]>(() =>
  repuestos.repuestos.map((repuesto) => {
    // `repuestos-disponibles` solo trae lo que tiene stock: un repuesto que no aparece tiene 0.
    const stock = stockPorRepuesto.value
      ? (stockPorRepuesto.value.get(repuesto.codigo_oe) ?? 0)
      : null
    return {
      codigo_oe: repuesto.codigo_oe,
      descripcion: repuesto.descripcion,
      marca: nombreDe(catalogos.itemsDe('marcas'), repuesto.tMarca_codigo_marca),
      categoria: nombreDe(catalogos.itemsDe('categorias'), repuesto.tCategoria_codigo_categoria),
      precio_venta: repuesto.precio_venta,
      stock_minimo: repuesto.stock_minimo,
      stock,
      estado: stock === null ? null : estadoDe(stock, repuesto.stock_minimo),
      acciones: null,
    }
  }),
)

// El color nunca va solo: cada estado lleva además un ícono y su texto.
const ESTADOS: Record<EstadoStock, { clase: string; icono: string; texto: string }> = {
  'sin-stock': {
    clase: 'bg-danger-subtle text-danger-emphasis',
    icono: 'x-circle',
    texto: 'Sin stock',
  },
  bajo: {
    clase: 'bg-warning-subtle text-warning-emphasis',
    icono: 'exclamation-triangle',
    texto: 'Stock bajo',
  },
  disponible: {
    clase: 'bg-success-subtle text-success-emphasis',
    icono: 'check-circle',
    texto: 'Disponible',
  },
}

const cargandoTabla = computed(() => repuestos.isLoading && repuestos.repuestos.length === 0)
const falloLaCarga = computed(() => repuestos.error !== null && repuestos.repuestos.length === 0)

// --- Panel lateral: uno de los dos formularios a la vez ---
const panel = ref<Panel>('cerrado')
const codigoInicial = ref<string | undefined>(undefined)

const catalogosDelFormulario = computed<CatalogosRepuesto>(() => ({
  marcas: catalogos.itemsDe('marcas') ?? [],
  categorias: catalogos.itemsDe('categorias') ?? [],
  bodegas: catalogos.itemsDe('bodegas') ?? [],
}))

function abrirIngreso(codigo?: string): void {
  codigoInicial.value = codigo
  panel.value = 'ingreso'
}

function abrirTraslado(codigo?: string): void {
  codigoInicial.value = codigo
  panel.value = 'traslado'
}

function cerrarPanel(): void {
  // Con una petición en curso no se cierra: el usuario perdería lo que escribió sin saber si se guardó.
  if (repuestos.isSaving) return
  panel.value = 'cerrado'
}

async function ingresar(datos: RepuestoNuevo): Promise<void> {
  // Si falló, el panel sigue abierto con lo que el usuario escribió; el toast dice por qué.
  if (await repuestos.ingresar(datos)) panel.value = 'cerrado'
}

async function trasladar(datos: TrasladoNuevo): Promise<void> {
  if (await repuestos.trasladar(datos)) panel.value = 'cerrado'
}
</script>

<template>
  <div class="d-grid gap-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <p class="text-body-secondary mb-0">
        Catálogo de repuestos con su stock total. El stock por bodega está en el reporte “Repuestos
        disponibles”.
      </p>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-neutral" @click="abrirTraslado()">
          <AppIcon nombre="arrow-left-right" />Trasladar entre bodegas
        </button>
        <button type="button" class="btn btn-primary" @click="abrirIngreso()">
          <AppIcon nombre="plus-lg" />Ingresar repuesto
        </button>
      </div>
    </div>

    <ErrorDeCarga
      v-if="falloLaCarga && repuestos.error"
      titulo="No se pudieron cargar los repuestos"
      :mensaje="repuestos.error"
      @reintentar="repuestos.cargar({ force: true })"
    />

    <DataTable
      v-else
      v-model:filtro="filtro"
      titulo="Repuestos"
      :columnas="columnas"
      :filas="filas"
      :cargando="cargandoTabla"
      :clave-fila="(fila) => fila.codigo_oe"
    >
      <template #celda-estado="{ valor }">
        <span
          v-if="typeof valor === 'string' && valor in ESTADOS"
          :class="['badge', ESTADOS[valor as EstadoStock].clase]"
        >
          <AppIcon :nombre="ESTADOS[valor as EstadoStock].icono" />
          {{ ESTADOS[valor as EstadoStock].texto }}
        </span>
        <template v-else>—</template>
      </template>

      <template #celda-acciones="{ fila }">
        <div class="d-flex justify-content-end gap-1">
          <button
            type="button"
            class="btn btn-neutral btn-icon btn-sm"
            :aria-label="`Ingresar stock de ${fila.codigo_oe}`"
            :title="`Ingresar stock de ${fila.codigo_oe}`"
            @click="abrirIngreso(fila.codigo_oe)"
          >
            <AppIcon nombre="plus-lg" />
          </button>
          <button
            type="button"
            class="btn btn-neutral btn-icon btn-sm"
            :aria-label="`Trasladar ${fila.codigo_oe} entre bodegas`"
            :title="`Trasladar ${fila.codigo_oe} entre bodegas`"
            @click="abrirTraslado(fila.codigo_oe)"
          >
            <AppIcon nombre="arrow-left-right" />
          </button>
        </div>
      </template>

      <template #vacio>
        <EmptyState
          icono="box-seam"
          titulo="Todavía no hay repuestos"
          texto="Los repuestos que ingreses van a aparecer aquí."
        />
      </template>
    </DataTable>
  </div>

  <SidePanel v-if="panel === 'ingreso'" titulo="Ingresar repuesto" @cerrar="cerrarPanel">
    <RepuestoForm
      :key="codigoInicial ?? 'nuevo'"
      :repuestos="repuestos.repuestos"
      :catalogos="catalogosDelFormulario"
      :codigo-inicial="codigoInicial"
      :enviando="repuestos.isSaving"
      @enviar="ingresar"
      @cancelar="cerrarPanel"
    />
  </SidePanel>

  <SidePanel
    v-else-if="panel === 'traslado'"
    titulo="Trasladar entre bodegas"
    @cerrar="cerrarPanel"
  >
    <TrasladoForm
      :key="codigoInicial ?? 'nuevo'"
      :repuestos="repuestos.repuestos"
      :bodegas="catalogosDelFormulario.bodegas"
      :disponibilidad="reportes.filasDe('repuestos-disponibles') ?? []"
      :codigo-inicial="codigoInicial"
      :enviando="repuestos.isSaving"
      @enviar="trasladar"
      @cancelar="cerrarPanel"
    />
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ErrorDeCarga from '@/components/common/ErrorDeCarga.vue'
import SidePanel from '@/components/common/SidePanel.vue'
import PagoForm from '@/components/pagos/PagoForm.vue'
import PagosTable from '@/components/pagos/PagosTable.vue'
import { useFiltroUrl } from '@/composables/useFiltroUrl'
import { useCatalogosStore } from '@/stores/catalogos'
import { usePagosStore } from '@/stores/pagos'
import { useReportesStore } from '@/stores/reportes'
import type { Pago, PagoNuevo } from '@/types/pago'
import { formatearMoneda } from '@/utils/moneda'

const pagos = usePagosStore()
const catalogos = useCatalogosStore()
const reportes = useReportesStore()

const filtro = useFiltroUrl()

onMounted(() => {
  void pagos.cargar()
  void catalogos.cargar('formas-pago')
  // Las facturas a las que se puede pagar son las del reporte `cuentas-por-cobrar` (caché compartida).
  void reportes.cargar('cuentas-por-cobrar')
})

const facturasConSaldo = computed(() => reportes.filasDe('cuentas-por-cobrar') ?? [])
const formasPago = computed(() => catalogos.itemsDe('formas-pago') ?? [])

// Con la lista ya en pantalla, recargarla después de una escritura no vuelve a mostrar el skeleton.
const cargandoTabla = computed(() => pagos.isLoading && pagos.pagos.length === 0)
const falloLaCarga = computed(() => pagos.error !== null && pagos.pagos.length === 0)

// --- Registrar un pago (CU-10): panel lateral ---
const panelAbierto = ref(false)

function abrirPanel(): void {
  panelAbierto.value = true
}

function cerrarPanel(): void {
  // Con una petición en curso no se cierra: el usuario perdería lo que escribió sin saber si se guardó.
  if (pagos.isSaving) return
  panelAbierto.value = false
}

async function registrar(datos: PagoNuevo): Promise<void> {
  // Si falló, el panel sigue abierto con lo que el usuario escribió; el toast dice por qué.
  if (await pagos.registrar(datos)) panelAbierto.value = false
}

// --- Eliminar un pago (CU-11): siempre pasa por el ConfirmDialog ---
const pagoPorEliminar = ref<Pago | null>(null)
// El último pago que se mostró en el diálogo: al cerrarse, el texto no se vacía durante la animación de salida.
const pagoMostrado = ref<Pago | null>(null)

function pedirConfirmacion(codigo: string): void {
  const pago = pagos.pagos.find((candidato) => candidato.codigo_pago === codigo) ?? null
  pagoPorEliminar.value = pago
  if (pago) pagoMostrado.value = pago
}

function descartarEliminacion(): void {
  if (pagos.isSaving) return
  pagoPorEliminar.value = null
}

async function confirmarEliminacion(): Promise<void> {
  const pago = pagoPorEliminar.value
  if (!pago) return
  // Salga bien o mal (por ejemplo, un pago de otro día), el diálogo se cierra: el toast da el resultado.
  await pagos.eliminar(pago.codigo_pago)
  pagoPorEliminar.value = null
}

const mensajeDeEliminacion = computed(() => {
  const pago = pagoMostrado.value
  if (!pago) return ''
  return (
    `Se eliminará el pago ${pago.codigo_pago} de ${formatearMoneda(pago.monto)} y el saldo de la ` +
    `factura ${pago.tFactura_numero_factura} volverá a subir ese monto. Esta acción no se puede deshacer.`
  )
})
</script>

<template>
  <div class="d-grid gap-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <p class="text-body-secondary mb-0">
        Pagos recibidos, los más recientes primero. Solo se pueden eliminar los de hoy.
      </p>
      <button type="button" class="btn btn-primary" @click="abrirPanel">
        <AppIcon nombre="plus-lg" />Registrar pago
      </button>
    </div>

    <ErrorDeCarga
      v-if="falloLaCarga && pagos.error"
      titulo="No se pudieron cargar los pagos"
      :mensaje="pagos.error"
      @reintentar="pagos.cargar({ force: true })"
    />

    <PagosTable
      v-else
      v-model:filtro="filtro"
      :pagos="pagos.pagos"
      :formas-pago="formasPago"
      :cargando="cargandoTabla"
      @eliminar="pedirConfirmacion"
    />
  </div>

  <SidePanel v-if="panelAbierto" titulo="Registrar pago" @cerrar="cerrarPanel">
    <PagoForm
      :facturas="facturasConSaldo"
      :formas-pago="formasPago"
      :enviando="pagos.isSaving"
      @enviar="registrar"
      @cancelar="cerrarPanel"
    />
  </SidePanel>

  <ConfirmDialog
    :abierto="pagoPorEliminar !== null"
    titulo="¿Eliminar este pago?"
    :mensaje="mensajeDeEliminacion"
    :procesando="pagos.isSaving"
    @confirmar="confirmarEliminacion"
    @cancelar="descartarEliminacion"
  />
</template>

<script setup lang="ts">
// TEMPORAL (Pausa 4): muestra los componentes de common/ en uso, con datos de los mocks.
// No está en el menú (se abre por URL) y se borra en el bloque G2. Llama a los services
// directo, a propósito: lo normal es pasar por un store.
import { computed, onMounted, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import ChartCard from '@/components/common/ChartCard.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormField from '@/components/common/FormField.vue'
import KpiCard from '@/components/common/KpiCard.vue'
import { reportesService, clientesService } from '@/services'
import { useNotificacionesStore } from '@/stores/notificaciones'
import type { ItemLeyenda } from '@/types/grafico'
import type { Cliente } from '@/types/cliente'
import type { CuentaPorCobrar } from '@/types/reportes'
import type { ColumnaTabla } from '@/types/tabla'
import { leerVariableCss } from '@/utils/colores'
import { formatearEntero, formatearMoneda } from '@/utils/moneda'

const notificaciones = useNotificacionesStore()

const clientes = ref<Cliente[]>([])
const cuentas = ref<CuentaPorCobrar[]>([])
const cargando = ref(true)
const filtroClientes = ref('')
const confirmando = ref(false)
const procesando = ref(false)
const ultimaSeleccion = ref('ninguna todavía')
const campoDemo = ref('')

onMounted(async () => {
  ;[clientes.value, cuentas.value] = await Promise.all([
    clientesService.listar(),
    reportesService.obtener('cuentas-por-cobrar'),
  ])
  cargando.value = false
})

const columnasClientes: ColumnaTabla<Cliente>[] = [
  { clave: 'numero_identificacion', etiqueta: 'Identificación', principal: true },
  { clave: 'razon_social', etiqueta: 'Razón social' },
  { clave: 'telefono', etiqueta: 'Teléfono' },
  { clave: 'fecha_registro', etiqueta: 'Registro', formato: 'fecha' },
]

const columnasCuentas: ColumnaTabla<CuentaPorCobrar>[] = [
  { clave: 'seriefactura', etiqueta: 'Factura', principal: true },
  { clave: 'Nombre_Cliente', etiqueta: 'Cliente' },
  { clave: 'fechafactura', etiqueta: 'Fecha', formato: 'fecha' },
  { clave: 'Total', etiqueta: 'Total', formato: 'moneda' },
  { clave: 'Saldo', etiqueta: 'Saldo', formato: 'moneda' },
]

const saldoTotal = computed(() => cuentas.value.reduce((suma, c) => suma + c.Saldo, 0))

// Los colores salen de las variables --cc-chart-*, nunca de un hex escrito aquí.
const leyenda = computed<ItemLeyenda[]>(() => [
  { etiqueta: 'Frenos', color: leerVariableCss('--cc-chart-1') },
  { etiqueta: 'Filtros', color: leerVariableCss('--cc-chart-2') },
  { etiqueta: 'Suspensión', color: leerVariableCss('--cc-chart-3') },
])

function simularCarga(): void {
  cargando.value = true
  setTimeout(() => (cargando.value = false), 2000)
}

function alSeleccionar(cliente: Cliente): void {
  ultimaSeleccion.value = cliente.razon_social
  notificaciones.info('Fila seleccionada', cliente.razon_social)
}

function alConfirmar(): void {
  procesando.value = true
  setTimeout(() => {
    procesando.value = false
    confirmando.value = false
    notificaciones.exito(
      'Pago eliminado',
      'se elimino el pago PAG-0017 de 300.00 (texto de ejemplo)',
    )
  }, 800)
}
</script>

<template>
  <div class="d-grid gap-4">
    <div class="alert alert-warning mb-0" role="note">
      <AppIcon nombre="exclamation-triangle" />
      <div>
        <span class="alert__title">Vista temporal (Pausa 4)</span>
        Muestra los componentes de <code>components/common/</code>. Se borra en el cierre.
      </div>
    </div>

    <section aria-labelledby="sec-kpi">
      <h2 id="sec-kpi" class="h3 mb-3">KpiCard</h2>
      <div class="row g-3">
        <div class="col-md-4">
          <KpiCard
            titulo="Saldo por cobrar"
            :valor="formatearMoneda(saldoTotal)"
            :detalle="`${cuentas.length} facturas con saldo`"
            :cargando="cargando"
          />
        </div>
        <div class="col-md-4">
          <KpiCard
            titulo="Clientes registrados"
            :valor="formatearEntero(clientes.length)"
            :cargando="cargando"
          />
        </div>
        <div class="col-md-4">
          <KpiCard titulo="Sin dato todavía" :valor="null" detalle="valor null → raya" />
        </div>
      </div>
    </section>

    <section aria-labelledby="sec-chart">
      <h2 id="sec-chart" class="h3 mb-3">ChartCard</h2>
      <ChartCard titulo="Venta por marca y categoría" subtitulo="Miles de USD" :leyenda="leyenda">
        <template #acciones>
          <button type="button" class="btn btn-neutral btn-sm">
            <AppIcon nombre="download" />Descargar
          </button>
        </template>
        <div class="d-flex h-100 align-items-center justify-content-center text-body-secondary">
          El gráfico (Chart.js) se monta aquí en el bloque E
        </div>
      </ChartCard>
    </section>

    <section aria-labelledby="sec-tabla">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 id="sec-tabla" class="h3 mb-0">DataTable</h2>
        <button type="button" class="btn btn-neutral" @click="simularCarga">
          <AppIcon nombre="arrow-repeat" />Simular carga (2 s)
        </button>
      </div>
      <p class="text-body-secondary">
        Clientes, con filtro y filas activables (clic o Enter). Última selección:
        <strong>{{ ultimaSeleccion }}</strong>
      </p>
      <DataTable
        v-model:filtro="filtroClientes"
        titulo="Clientes"
        :columnas="columnasClientes"
        :filas="clientes"
        :cargando="cargando"
        :clave-fila="(cliente) => cliente.numero_identificacion"
        seleccionable
        @seleccionar="alSeleccionar"
      />
    </section>

    <section aria-labelledby="sec-cuentas">
      <h2 id="sec-cuentas" class="h3 mb-3">DataTable con cifras y celda a medida</h2>
      <DataTable
        titulo="Cuentas por cobrar"
        :columnas="columnasCuentas"
        :filas="cuentas"
        :cargando="cargando"
        :clave-fila="(cuenta) => cuenta.seriefactura"
      >
        <template #celda-Saldo="{ valor }">
          <span class="badge bg-warning-subtle text-warning-emphasis">
            <AppIcon nombre="exclamation-triangle" />{{ formatearMoneda(Number(valor)) }}
          </span>
        </template>
      </DataTable>
    </section>

    <section aria-labelledby="sec-vacio">
      <h2 id="sec-vacio" class="h3 mb-3">DataTable sin filas</h2>
      <DataTable
        titulo="Pagos"
        :columnas="columnasCuentas"
        :filas="[]"
        :filtrable="false"
        texto-vacio="Esta factura todavía no tiene pagos."
      />
    </section>

    <section aria-labelledby="sec-otros">
      <h2 id="sec-otros" class="h3 mb-3">ConfirmDialog, ToastHost, EmptyState y FormField</h2>
      <div class="row g-4">
        <div class="col-lg-6">
          <div class="d-flex flex-wrap gap-2 mb-4">
            <button type="button" class="btn btn-outline-danger" @click="confirmando = true">
              <AppIcon nombre="trash" />Eliminar pago (demo)
            </button>
            <button
              type="button"
              class="btn btn-neutral"
              @click="notificaciones.exito('Cliente guardado', 'cliente TALLER NUEVO registrado')"
            >
              Toast éxito
            </button>
            <button
              type="button"
              class="btn btn-neutral"
              @click="
                notificaciones.error(
                  'No se puede eliminar',
                  'el pago PAG-0001 es del 2026-09-28; solo se eliminan pagos registrados hoy',
                )
              "
            >
              Toast error
            </button>
            <button
              type="button"
              class="btn btn-neutral"
              @click="notificaciones.info('Reporte listo', 'Se descargó cuentas-por-cobrar.pdf')"
            >
              Toast info
            </button>
          </div>
          <FormField
            id="demo-campo"
            etiqueta="Campo con validación"
            :error="
              campoDemo.length > 0 && campoDemo.length < 3 ? 'Escribe al menos 3 caracteres' : null
            "
            ayuda="Escribe 1 o 2 letras para ver el error."
            v-slot="{ invalido, describedby }"
          >
            <input
              id="demo-campo"
              v-model="campoDemo"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
            />
          </FormField>
        </div>
        <div class="col-lg-6">
          <div class="card">
            <EmptyState
              icono="inbox"
              titulo="Sin clientes"
              texto="Registra el primero para empezar."
            >
              <button type="button" class="btn btn-primary">
                <AppIcon nombre="plus-lg" />Nuevo cliente
              </button>
            </EmptyState>
          </div>
        </div>
      </div>
    </section>

    <ConfirmDialog
      :abierto="confirmando"
      titulo="¿Eliminar este pago?"
      mensaje="Se eliminará el pago PAG-0017 de $ 300,00 y la factura 001-001-000000122 volverá a deber ese monto. Esta acción no se puede deshacer."
      :procesando="procesando"
      @confirmar="alConfirmar"
      @cancelar="confirmando = false"
    />
  </div>
</template>

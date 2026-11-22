<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import ClienteForm from '@/components/clientes/ClienteForm.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorDeCarga from '@/components/common/ErrorDeCarga.vue'
import SidePanel from '@/components/common/SidePanel.vue'
import { useFiltroUrl } from '@/composables/useFiltroUrl'
import { useCatalogosStore } from '@/stores/catalogos'
import { useClientesStore } from '@/stores/clientes'
import { useNotificacionesStore } from '@/stores/notificaciones'
import type { ItemCatalogo } from '@/types/catalogo'
import { TIPO_IDENTIFICACION } from '@/types/cliente'
import type { CatalogosCliente, Cliente } from '@/types/cliente'
import type { ColumnaTabla } from '@/types/tabla'

/** Lo que muestra la tabla: el cliente con los códigos de tipo y ciudad ya traducidos a su nombre. */
interface FilaCliente {
  numero_identificacion: string
  razon_social: string
  tipo: string
  telefono: string | null
  email: string | null
  ciudad: string | null
  fecha_registro: string
}

const clientes = useClientesStore()
const catalogos = useCatalogosStore()
const notificaciones = useNotificacionesStore()

const filtro = useFiltroUrl()

onMounted(() => {
  void clientes.cargar()
  void catalogos.cargarVarios(['tipos-identificacion', 'ciudades'])
})

// --- Tabla ---
const columnas: ColumnaTabla<FilaCliente>[] = [
  { clave: 'numero_identificacion', etiqueta: 'Identificación', principal: true },
  { clave: 'razon_social', etiqueta: 'Nombre o razón social' },
  { clave: 'tipo', etiqueta: 'Tipo' },
  { clave: 'telefono', etiqueta: 'Teléfono', sinSaltos: true },
  { clave: 'email', etiqueta: 'Email' },
  { clave: 'ciudad', etiqueta: 'Ciudad' },
  { clave: 'fecha_registro', etiqueta: 'Registro', formato: 'fecha' },
]

function nombreDe(items: ItemCatalogo[] | undefined, codigo: string | null): string | null {
  if (codigo === null) return null
  // Mientras el catálogo no llega se muestra el código: la tabla no espera por él.
  return items?.find((item) => item.codigo === codigo)?.nombre ?? codigo
}

const filas = computed<FilaCliente[]>(() =>
  clientes.clientes.map((cliente) => ({
    numero_identificacion: cliente.numero_identificacion,
    razon_social: cliente.razon_social,
    tipo:
      nombreDe(
        catalogos.itemsDe('tipos-identificacion'),
        cliente.tTipoIdentificacion_codigo_tipo_identificacion,
      ) ?? '',
    telefono: cliente.telefono,
    email: cliente.email,
    ciudad: nombreDe(catalogos.itemsDe('ciudades'), cliente.tCiudad_codigo_ciudad),
    fecha_registro: cliente.fecha_registro,
  })),
)

// Con la lista ya en pantalla, recargarla después de guardar no vuelve a mostrar el skeleton.
const cargandoTabla = computed(() => clientes.isLoading && clientes.clientes.length === 0)
const falloLaCarga = computed(() => clientes.error !== null && clientes.clientes.length === 0)

// --- Panel lateral ---
const panelAbierto = ref(false)
const clienteEnEdicion = ref<Cliente | null>(null)

const catalogosDelFormulario = computed<CatalogosCliente>(() => ({
  tiposIdentificacion: catalogos.itemsDe('tipos-identificacion') ?? [],
  ciudades: catalogos.itemsDe('ciudades') ?? [],
}))

function abrirNuevo(): void {
  clienteEnEdicion.value = null
  panelAbierto.value = true
}

function abrirEdicion(fila: FilaCliente): void {
  const cliente = clientes.clientes.find(
    (c) => c.numero_identificacion === fila.numero_identificacion,
  )
  if (!cliente) return
  // `registrar_cliente` no modifica al consumidor final.
  if (
    cliente.tTipoIdentificacion_codigo_tipo_identificacion === TIPO_IDENTIFICACION.CONSUMIDOR_FINAL
  ) {
    notificaciones.info('Consumidor final', 'El consumidor final no se puede modificar.')
    return
  }
  clienteEnEdicion.value = cliente
  panelAbierto.value = true
}

function cerrarPanel(): void {
  // Con una petición en curso no se cierra: el usuario perdería lo que escribió sin saber si se guardó.
  if (clientes.isSaving) return
  panelAbierto.value = false
}

async function guardar(datos: Parameters<typeof clientes.registrar>[0]): Promise<void> {
  // Si falló, el panel sigue abierto con lo que el usuario escribió; el toast dice por qué.
  if (await clientes.registrar(datos)) panelAbierto.value = false
}
</script>

<template>
  <div class="d-grid gap-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <p class="text-body-secondary mb-0">
        Clientes registrados. Haz clic en uno para editar sus datos.
      </p>
      <button type="button" class="btn btn-primary" @click="abrirNuevo">
        <AppIcon nombre="plus-lg" />Nuevo cliente
      </button>
    </div>

    <ErrorDeCarga
      v-if="falloLaCarga && clientes.error"
      titulo="No se pudieron cargar los clientes"
      :mensaje="clientes.error"
      @reintentar="clientes.cargar({ force: true })"
    />

    <DataTable
      v-else
      v-model:filtro="filtro"
      titulo="Clientes"
      :columnas="columnas"
      :filas="filas"
      :cargando="cargandoTabla"
      :clave-fila="(fila) => fila.numero_identificacion"
      seleccionable
      @seleccionar="abrirEdicion"
    >
      <template #vacio>
        <EmptyState
          icono="people"
          titulo="Todavía no hay clientes"
          texto="Los clientes que registres van a aparecer aquí."
        />
      </template>
    </DataTable>
  </div>

  <SidePanel
    v-if="panelAbierto"
    :titulo="clienteEnEdicion ? 'Editar cliente' : 'Nuevo cliente'"
    @cerrar="cerrarPanel"
  >
    <ClienteForm
      :key="clienteEnEdicion?.numero_identificacion ?? 'nuevo'"
      :cliente="clienteEnEdicion"
      :catalogos="catalogosDelFormulario"
      :enviando="clientes.isSaving"
      @enviar="guardar"
      @cancelar="cerrarPanel"
    />
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import ErrorDeCarga from '@/components/common/ErrorDeCarga.vue'
import FacturaForm from '@/components/facturas/FacturaForm.vue'
import { IVA_POR_DEFECTO } from '@/config/facturacion'
import { useCatalogosStore } from '@/stores/catalogos'
import { useClientesStore } from '@/stores/clientes'
import { useFacturasStore } from '@/stores/facturas'
import { useRepuestosStore } from '@/stores/repuestos'
import type { FacturaNueva } from '@/types/factura'

const clientes = useClientesStore()
const repuestos = useRepuestosStore()
const catalogos = useCatalogosStore()
const facturas = useFacturasStore()

onMounted(() => {
  void clientes.cargar()
  void repuestos.cargar()
  void catalogos.cargar('formas-pago')
})

// Con los datos ya en pantalla, recargarlos en segundo plano no vuelve a bloquear el formulario.
const cargando = computed(
  () =>
    (clientes.isLoading && clientes.clientes.length === 0) ||
    (repuestos.isLoading && repuestos.repuestos.length === 0),
)

const errorDeCarga = computed(() => {
  if (clientes.error !== null && clientes.clientes.length === 0) return clientes.error
  if (repuestos.error !== null && repuestos.repuestos.length === 0) return repuestos.error
  return null
})

function reintentar(): void {
  void clientes.cargar({ force: true })
  void repuestos.cargar({ force: true })
}

// Cambiar la `key` recrea el formulario: es la forma de dejarlo vacío para la siguiente factura.
const claveFormulario = ref(0)

async function emitir(datos: FacturaNueva): Promise<void> {
  // Si falló, el formulario sigue con lo que el usuario escribió; el toast dice por qué.
  if (await facturas.emitir(datos)) claveFormulario.value++
}
</script>

<template>
  <div class="d-grid gap-3">
    <p class="text-body-secondary mb-0">
      Elige el cliente y agrega los repuestos. El total se calcula con IVA del
      {{ IVA_POR_DEFECTO }} %.
    </p>

    <ErrorDeCarga
      v-if="errorDeCarga"
      titulo="No se pudieron cargar los datos de la factura"
      :mensaje="errorDeCarga"
      @reintentar="reintentar"
    />

    <FacturaForm
      v-else
      :key="claveFormulario"
      :clientes="clientes.clientes"
      :repuestos="repuestos.repuestos"
      :formas-pago="catalogos.itemsDe('formas-pago') ?? []"
      :porcentaje-iva="IVA_POR_DEFECTO"
      :cargando="cargando"
      :enviando="facturas.isSaving"
      @enviar="emitir"
      @cancelar="claveFormulario++"
    />
  </div>
</template>

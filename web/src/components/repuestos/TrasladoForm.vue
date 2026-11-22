<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import FormField from '@/components/common/FormField.vue'
import type { ItemCatalogo } from '@/types/catalogo'
import type { Repuesto, TrasladoNuevo } from '@/types/repuesto'
import type { RepuestoDisponible } from '@/types/reportes'
import { aEntero, textoONull, validarCantidad, validarLargoMaximo } from '@/utils/validaciones'

const props = defineProps<{
  /** Repuestos entre los que se puede elegir. */
  repuestos: Repuesto[]
  bodegas: ItemCatalogo[]
  /** Stock por bodega (reporte `repuestos-disponibles`): solo para sugerir el origen y mostrar cuánto hay. */
  disponibilidad: RepuestoDisponible[]
  /** Repuesto ya elegido (desde el botón de una fila). */
  codigoInicial?: string
  /** Hay una petición en curso: se deshabilitan los botones. */
  enviando?: boolean
}>()

const emit = defineEmits<{
  enviar: [datos: TrasladoNuevo]
  cancelar: []
}>()

const formulario = reactive({
  codigo: props.codigoInicial ?? '',
  origen: '',
  destino: '',
  cantidad: '',
  ubicacionDestino: '',
})

const stockDelRepuesto = computed(() =>
  props.disponibilidad.filter((fila) => fila.Codigo_oe === formulario.codigo),
)

/**
 * Las bodegas que tienen el repuesto. Si no se pudo cargar el stock (el reporte falló), se ofrecen
 * todas: la base responde si en esa bodega no hay.
 */
const bodegasDeOrigen = computed(() => {
  if (props.disponibilidad.length === 0) return props.bodegas
  const conStock = new Set(stockDelRepuesto.value.map((fila) => fila.Bodega))
  return props.bodegas.filter((bodega) => conStock.has(bodega.codigo))
})

const bodegasDeDestino = computed(() =>
  props.bodegas.filter((bodega) => bodega.codigo !== formulario.origen),
)

const stockEnOrigen = computed(
  () => stockDelRepuesto.value.find((fila) => fila.Bodega === formulario.origen)?.cantidad,
)

// Al cambiar de repuesto, el origen elegido puede ya no tenerlo.
watch(
  () => formulario.codigo,
  () => {
    if (!bodegasDeOrigen.value.some((bodega) => bodega.codigo === formulario.origen)) {
      formulario.origen = ''
    }
  },
)
// Y el destino no puede ser el mismo que el origen.
watch(
  () => formulario.origen,
  () => {
    if (formulario.destino === formulario.origen) formulario.destino = ''
  },
)

// Los errores de campo solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errores = computed(() => {
  if (!intentoEnvio.value) {
    return { codigo: null, origen: null, destino: null, cantidad: null, ubicacion: null }
  }
  return {
    codigo: formulario.codigo === '' ? 'Elige el repuesto' : null,
    origen: formulario.origen === '' ? 'Elige la bodega de origen' : null,
    destino:
      formulario.destino === ''
        ? 'Elige la bodega de destino'
        : formulario.destino === formulario.origen
          ? 'El destino tiene que ser distinto del origen'
          : null,
    // No se compara con el stock: si se pide más de lo que hay, el mensaje lo da la base.
    cantidad: validarCantidad(formulario.cantidad),
    ubicacion: validarLargoMaximo(formulario.ubicacionDestino, 45, 'La ubicación'),
  }
})

function enviar(): void {
  intentoEnvio.value = true
  if (Object.values(errores.value).some((error) => error !== null)) return

  emit('enviar', {
    codigo_oe: formulario.codigo,
    bodega_origen: formulario.origen,
    bodega_destino: formulario.destino,
    // Ya validada: llega un entero mayor que 0.
    cantidad: aEntero(formulario.cantidad) ?? 0,
    ubicacion_destino: textoONull(formulario.ubicacionDestino),
  })
}
</script>

<template>
  <form class="d-flex flex-column flex-grow-1" novalidate @submit.prevent="enviar">
    <FormField
      id="traslado-codigo"
      etiqueta="Repuesto"
      :error="errores.codigo"
      v-slot="{ invalido, describedby }"
    >
      <select
        id="traslado-codigo"
        v-model="formulario.codigo"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
        :disabled="Boolean(codigoInicial)"
      >
        <option value="" disabled>Elige un repuesto</option>
        <option v-for="repuesto in repuestos" :key="repuesto.codigo_oe" :value="repuesto.codigo_oe">
          {{ repuesto.codigo_oe }} · {{ repuesto.descripcion }}
        </option>
      </select>
    </FormField>

    <FormField
      id="traslado-origen"
      etiqueta="Bodega de origen"
      :error="errores.origen"
      :ayuda="
        stockEnOrigen !== undefined
          ? `Hay ${stockEnOrigen} ${stockEnOrigen === 1 ? 'unidad' : 'unidades'} en esta bodega`
          : undefined
      "
      v-slot="{ invalido, describedby }"
    >
      <select
        id="traslado-origen"
        v-model="formulario.origen"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      >
        <option value="" disabled>Elige la bodega</option>
        <option v-for="bodega in bodegasDeOrigen" :key="bodega.codigo" :value="bodega.codigo">
          {{ bodega.nombre }}
        </option>
      </select>
    </FormField>

    <FormField
      id="traslado-destino"
      etiqueta="Bodega de destino"
      :error="errores.destino"
      v-slot="{ invalido, describedby }"
    >
      <select
        id="traslado-destino"
        v-model="formulario.destino"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      >
        <option value="" disabled>Elige la bodega</option>
        <option v-for="bodega in bodegasDeDestino" :key="bodega.codigo" :value="bodega.codigo">
          {{ bodega.nombre }}
        </option>
      </select>
    </FormField>

    <div class="row g-3">
      <div class="col-6">
        <FormField
          id="traslado-cantidad"
          etiqueta="Cantidad"
          :error="errores.cantidad"
          v-slot="{ invalido, describedby }"
        >
          <input
            id="traslado-cantidad"
            v-model="formulario.cantidad"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            class="form-control form-control-lg"
            :class="{ 'is-invalid': invalido }"
            :aria-describedby="describedby"
          />
        </FormField>
      </div>
      <div class="col-6">
        <FormField
          id="traslado-ubicacion"
          etiqueta="Ubicación en destino"
          :error="errores.ubicacion"
          v-slot="{ invalido, describedby }"
        >
          <input
            id="traslado-ubicacion"
            v-model="formulario.ubicacionDestino"
            type="text"
            autocomplete="off"
            placeholder="Opcional"
            class="form-control form-control-lg"
            :class="{ 'is-invalid': invalido }"
            :aria-describedby="describedby"
          />
        </FormField>
      </div>
    </div>

    <div class="cc-form-actions">
      <button type="button" class="btn btn-neutral" :disabled="enviando" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        Trasladar
      </button>
    </div>
  </form>
</template>

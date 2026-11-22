<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import FormField from '@/components/common/FormField.vue'
import type { ItemCatalogo } from '@/types/catalogo'
import type { PagoNuevo } from '@/types/pago'
import type { CuentaPorCobrar } from '@/types/reportes'
import { sugerirCodigo } from '@/utils/codigos'
import { formatearMoneda } from '@/utils/moneda'
import {
  aNumero,
  textoONull,
  validarLargoMaximo,
  validarMonto,
  validarObligatorio,
} from '@/utils/validaciones'

const props = defineProps<{
  /** Facturas con saldo pendiente (reporte `cuentas-por-cobrar`): son las únicas a las que se puede pagar. */
  facturas: CuentaPorCobrar[]
  formasPago: ItemCatalogo[]
  /** Hay una petición en curso: se deshabilitan los botones. */
  enviando?: boolean
}>()

const emit = defineEmits<{
  enviar: [datos: PagoNuevo]
  cancelar: []
}>()

const formulario = reactive({
  factura: '',
  // Se precarga un código para no obligar a inventarlo; se puede cambiar.
  codigo: sugerirCodigo('PAG'),
  monto: '',
  forma: '',
  referencia: '',
})

const facturaElegida = computed(() =>
  props.facturas.find((factura) => factura.seriefactura === formulario.factura),
)

/** "592,35": el saldo escrito como lo escribiría el usuario en el campo de monto. */
function saldoComoTexto(factura: CuentaPorCobrar): string {
  return factura.Saldo.toFixed(2).replace('.', ',')
}

function usarSaldoCompleto(): void {
  if (facturaElegida.value) formulario.monto = saldoComoTexto(facturaElegida.value)
}

// Los errores de campo solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errores = computed(() => {
  if (!intentoEnvio.value) {
    return { factura: null, codigo: null, monto: null, forma: null, referencia: null }
  }
  return {
    factura: validarObligatorio(formulario.factura, 'Elige la factura'),
    codigo:
      validarObligatorio(formulario.codigo, 'Escribe el código del pago') ??
      validarLargoMaximo(formulario.codigo, 45, 'El código'),
    // No se compara con el saldo: si el monto lo supera, el mensaje lo da la base.
    monto: validarMonto(formulario.monto, 'El monto'),
    forma: validarObligatorio(formulario.forma, 'Elige la forma de pago'),
    referencia: validarLargoMaximo(formulario.referencia, 45, 'La referencia'),
  }
})

function enviar(): void {
  intentoEnvio.value = true
  if (Object.values(errores.value).some((error) => error !== null)) return

  emit('enviar', {
    codigo_pago: formulario.codigo.trim(),
    numero_factura: formulario.factura,
    // Ya validado: llega un número mayor que 0.
    monto: aNumero(formulario.monto) ?? 0,
    forma_pago: formulario.forma,
    referencia: textoONull(formulario.referencia),
  })
}
</script>

<template>
  <form class="d-flex flex-column flex-grow-1" novalidate @submit.prevent="enviar">
    <FormField
      id="pago-factura"
      etiqueta="Factura"
      :error="errores.factura"
      :ayuda="
        facturaElegida
          ? `Saldo pendiente: ${formatearMoneda(facturaElegida.Saldo)}`
          : facturas.length === 0
            ? 'No hay facturas con saldo pendiente.'
            : undefined
      "
      v-slot="{ invalido, describedby }"
    >
      <select
        id="pago-factura"
        v-model="formulario.factura"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      >
        <option value="" disabled>Elige una factura</option>
        <option
          v-for="factura in facturas"
          :key="factura.seriefactura"
          :value="factura.seriefactura"
        >
          {{ factura.seriefactura }} · {{ factura.Nombre_Cliente }} · Saldo
          {{ formatearMoneda(factura.Saldo) }}
        </option>
      </select>
    </FormField>

    <FormField
      id="pago-monto"
      etiqueta="Monto"
      :error="errores.monto"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="pago-monto"
        v-model="formulario.monto"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder="0,00"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>
    <button
      v-if="facturaElegida"
      type="button"
      class="btn btn-link btn-sm align-self-start p-0 mb-3 mt-n2"
      @click="usarSaldoCompleto"
    >
      Pagar el saldo completo ({{ formatearMoneda(facturaElegida.Saldo) }})
    </button>

    <FormField
      id="pago-forma"
      etiqueta="Forma de pago"
      :error="errores.forma"
      v-slot="{ invalido, describedby }"
    >
      <select
        id="pago-forma"
        v-model="formulario.forma"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      >
        <option value="" disabled>Elige la forma de pago</option>
        <option v-for="forma in formasPago" :key="forma.codigo" :value="forma.codigo">
          {{ forma.nombre }}
        </option>
      </select>
    </FormField>

    <FormField
      id="pago-referencia"
      etiqueta="Referencia (opcional)"
      :error="errores.referencia"
      ayuda="Número de transferencia o de comprobante."
      v-slot="{ invalido, describedby }"
    >
      <input
        id="pago-referencia"
        v-model="formulario.referencia"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="pago-codigo"
      etiqueta="Código del pago"
      :error="errores.codigo"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="pago-codigo"
        v-model="formulario.codigo"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <div class="cc-form-actions">
      <button type="button" class="btn btn-neutral" :disabled="enviando" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        Registrar pago
      </button>
    </div>
  </form>
</template>

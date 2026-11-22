<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import FormField from '@/components/common/FormField.vue'
import type { ItemCatalogo } from '@/types/catalogo'
import type { Cliente } from '@/types/cliente'
import type { FacturaNueva } from '@/types/factura'
import type { Repuesto } from '@/types/repuesto'
import { calcularTotales, valorDeLinea } from '@/utils/factura'
import { formatearMoneda } from '@/utils/moneda'
import {
  aEntero,
  aNumero,
  textoONull,
  validarCantidad,
  validarObligatorio,
  validarPorcentaje,
} from '@/utils/validaciones'

/** Una línea mientras se escribe: todo en texto, como lo escribe el usuario. */
interface LineaEnEdicion {
  /** Para que Vue distinga las líneas al quitar una del medio (no es el código del repuesto). */
  id: number
  codigo: string
  cantidad: string
  descuento: string
}

const props = defineProps<{
  clientes: Cliente[]
  repuestos: Repuesto[]
  formasPago: ItemCatalogo[]
  /** IVA con el que se calcula el total (`porcentaje_iva` de `tFactura`). */
  porcentajeIva: number
  /** Los clientes o los repuestos todavía no llegaron. */
  cargando?: boolean
  /** Hay una petición en curso: se deshabilitan los botones. */
  enviando?: boolean
}>()

const emit = defineEmits<{
  /** ⚠ CU-09 (propuesta): ver `types/factura.ts`. */
  enviar: [datos: FacturaNueva]
  /** El botón "Limpiar": quien escucha decide si vacía el formulario. */
  cancelar: []
}>()

let siguienteId = 1
function nuevaLinea(): LineaEnEdicion {
  return { id: siguienteId++, codigo: '', cantidad: '1', descuento: '0' }
}

const formulario = reactive({
  cliente: '',
  forma: '',
  lineas: [nuevaLinea()],
})

function precioDe(codigo: string): number | undefined {
  return props.repuestos.find((repuesto) => repuesto.codigo_oe === codigo)?.precio_venta
}

function agregarLinea(): void {
  formulario.lineas.push(nuevaLinea())
}

function quitarLinea(id: number): void {
  // Siempre queda al menos una: una factura sin líneas no existe.
  if (formulario.lineas.length > 1) {
    formulario.lineas = formulario.lineas.filter((linea) => linea.id !== id)
  }
}

/** La línea como números, para calcular. Lo que aún no es un número válido cuenta como 0. */
function comoCalculable(linea: LineaEnEdicion) {
  return {
    precioUnitario: precioDe(linea.codigo) ?? 0,
    cantidad: aEntero(linea.cantidad) ?? 0,
    porcentajeDescuento: Math.min(aNumero(linea.descuento) ?? 0, 100),
  }
}

const totales = computed(() =>
  calcularTotales(formulario.lineas.map(comoCalculable), props.porcentajeIva),
)

function valorDeLaLinea(linea: LineaEnEdicion): number {
  return valorDeLinea(comoCalculable(linea))
}

// Los errores solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errorCliente = computed(() =>
  intentoEnvio.value ? validarObligatorio(formulario.cliente, 'Elige el cliente') : null,
)

function erroresDe(linea: LineaEnEdicion) {
  if (!intentoEnvio.value) return { codigo: null, cantidad: null, descuento: null }
  // La clave de `tDetalleFactura` es (repuesto, factura): el mismo repuesto no puede ir en dos líneas.
  const repetido =
    linea.codigo !== '' && formulario.lineas.filter((l) => l.codigo === linea.codigo).length > 1
  return {
    codigo:
      validarObligatorio(linea.codigo, 'Elige el repuesto') ??
      (repetido ? 'Este repuesto ya está en otra línea' : null),
    cantidad: validarCantidad(linea.cantidad),
    descuento: validarPorcentaje(linea.descuento),
  }
}

const hayErrores = computed(
  () =>
    errorCliente.value !== null ||
    formulario.lineas.some((linea) =>
      Object.values(erroresDe(linea)).some((error) => error !== null),
    ),
)

function enviar(): void {
  intentoEnvio.value = true
  if (hayErrores.value) return

  emit('enviar', {
    numero_identificacion: formulario.cliente,
    porcentaje_iva: props.porcentajeIva,
    forma_pago: textoONull(formulario.forma),
    lineas: formulario.lineas.map((linea) => ({
      codigo_oe: linea.codigo,
      // Ya validadas: llegan un entero mayor que 0 y un porcentaje de 0 a 100.
      cantidad: aEntero(linea.cantidad) ?? 0,
      porcentaje_descuento: aNumero(linea.descuento) ?? 0,
    })),
  })
}
</script>

<template>
  <form class="row g-3" novalidate @submit.prevent="enviar">
    <div class="col-lg-8 d-grid gap-3 align-content-start">
      <section class="card" aria-labelledby="factura-titulo-cliente">
        <div class="card-body">
          <h2 id="factura-titulo-cliente" class="h3 mb-3">Cliente</h2>
          <FormField
            id="factura-cliente"
            etiqueta="Cliente"
            :error="errorCliente"
            v-slot="{ invalido, describedby }"
            compacto
          >
            <select
              id="factura-cliente"
              v-model="formulario.cliente"
              class="form-select form-select-lg"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
              :disabled="cargando"
            >
              <option value="" disabled>{{ cargando ? 'Cargando…' : 'Elige un cliente' }}</option>
              <option
                v-for="cliente in clientes"
                :key="cliente.numero_identificacion"
                :value="cliente.numero_identificacion"
              >
                {{ cliente.razon_social }} · {{ cliente.numero_identificacion }}
              </option>
            </select>
          </FormField>
        </div>
      </section>

      <section class="card" aria-labelledby="factura-titulo-lineas">
        <div class="card-body">
          <h2 id="factura-titulo-lineas" class="h3 mb-3">Repuestos</h2>

          <div
            v-for="(linea, indice) in formulario.lineas"
            :key="linea.id"
            class="row g-2 align-items-start"
            role="group"
            :aria-label="`Línea ${indice + 1}`"
          >
            <div class="col-12 col-lg-5">
              <FormField
                :id="`factura-linea-${linea.id}-codigo`"
                etiqueta="Repuesto"
                :error="erroresDe(linea).codigo"
                :ayuda="
                  precioDe(linea.codigo) !== undefined
                    ? `Precio: ${formatearMoneda(precioDe(linea.codigo) ?? 0)}`
                    : undefined
                "
                v-slot="{ invalido, describedby }"
              >
                <select
                  :id="`factura-linea-${linea.id}-codigo`"
                  v-model="linea.codigo"
                  class="form-select form-select-lg"
                  :class="{ 'is-invalid': invalido }"
                  :aria-describedby="describedby"
                  :disabled="cargando"
                >
                  <option value="" disabled>
                    {{ cargando ? 'Cargando…' : 'Elige un repuesto' }}
                  </option>
                  <option
                    v-for="repuesto in repuestos"
                    :key="repuesto.codigo_oe"
                    :value="repuesto.codigo_oe"
                  >
                    {{ repuesto.codigo_oe }} · {{ repuesto.descripcion }}
                  </option>
                </select>
              </FormField>
            </div>

            <div class="col-4 col-lg-2">
              <FormField
                :id="`factura-linea-${linea.id}-cantidad`"
                etiqueta="Cantidad"
                :error="erroresDe(linea).cantidad"
                v-slot="{ invalido, describedby }"
              >
                <input
                  :id="`factura-linea-${linea.id}-cantidad`"
                  v-model="linea.cantidad"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  class="form-control form-control-lg"
                  :class="{ 'is-invalid': invalido }"
                  :aria-describedby="describedby"
                />
              </FormField>
            </div>

            <div class="col-4 col-lg-2">
              <FormField
                :id="`factura-linea-${linea.id}-descuento`"
                etiqueta="Desc. %"
                :error="erroresDe(linea).descuento"
                v-slot="{ invalido, describedby }"
              >
                <input
                  :id="`factura-linea-${linea.id}-descuento`"
                  v-model="linea.descuento"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  class="form-control form-control-lg"
                  :class="{ 'is-invalid': invalido }"
                  :aria-describedby="describedby"
                />
              </FormField>
            </div>

            <div class="col-4 col-lg-2 text-end">
              <div class="form-label">Valor</div>
              <!-- El valor de la línea sin IVA, calculado en vivo: quien factura ve cuánto suma -->
              <div class="tabular pt-2 mb-3 cc-cell-main" aria-live="polite">
                {{ formatearMoneda(valorDeLaLinea(linea)) }}
              </div>
            </div>

            <div class="col-12 col-lg-1 text-end">
              <div class="form-label d-none d-lg-block">&nbsp;</div>
              <button
                type="button"
                class="btn btn-neutral btn-icon btn-sm text-danger mb-3"
                :aria-label="`Quitar la línea ${indice + 1}`"
                :title="`Quitar la línea ${indice + 1}`"
                :disabled="formulario.lineas.length === 1"
                @click="quitarLinea(linea.id)"
              >
                <AppIcon nombre="trash" />
              </button>
            </div>
          </div>

          <button type="button" class="btn btn-neutral" @click="agregarLinea">
            <AppIcon nombre="plus-lg" />Agregar repuesto
          </button>
        </div>
      </section>
    </div>

    <aside class="col-lg-4" aria-label="Resumen de la factura">
      <div class="card">
        <div class="card-body">
          <h2 class="h3 mb-3">Resumen</h2>

          <dl class="mb-3">
            <div class="d-flex justify-content-between py-1">
              <dt class="fw-normal text-body-secondary">Subtotal</dt>
              <dd class="mb-0 tabular">{{ formatearMoneda(totales.subtotal) }}</dd>
            </div>
            <div class="d-flex justify-content-between py-1">
              <dt class="fw-normal text-body-secondary">Descuento</dt>
              <dd class="mb-0 tabular">{{ formatearMoneda(-totales.descuento) }}</dd>
            </div>
            <div class="d-flex justify-content-between py-1">
              <dt class="fw-normal text-body-secondary">IVA {{ porcentajeIva }} %</dt>
              <dd class="mb-0 tabular">{{ formatearMoneda(totales.iva) }}</dd>
            </div>
            <div class="d-flex justify-content-between border-top pt-3 mt-2">
              <dt class="h3 mb-0">Total</dt>
              <dd class="h3 mb-0 tabular" data-testid="total">
                {{ formatearMoneda(totales.total) }}
              </dd>
            </div>
          </dl>

          <FormField
            id="factura-forma"
            etiqueta="Forma de pago"
            :ayuda="
              formulario.forma === ''
                ? 'Sin forma de pago, la factura queda con saldo por cobrar.'
                : 'Se registra un pago por el total al emitir la factura.'
            "
            v-slot="{ describedby }"
          >
            <select
              id="factura-forma"
              v-model="formulario.forma"
              class="form-select form-select-lg"
              :aria-describedby="describedby"
            >
              <option value="">A crédito (sin pago ahora)</option>
              <option v-for="forma in formasPago" :key="forma.codigo" :value="forma.codigo">
                {{ forma.nombre }}
              </option>
            </select>
          </FormField>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary btn-lg" :disabled="enviando || cargando">
              <span
                v-if="enviando"
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
              ></span>
              Emitir factura
            </button>
            <button
              type="button"
              class="btn btn-neutral"
              :disabled="enviando"
              @click="emit('cancelar')"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </aside>
  </form>
</template>

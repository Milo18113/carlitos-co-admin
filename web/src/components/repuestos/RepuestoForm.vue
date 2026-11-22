<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import FormField from '@/components/common/FormField.vue'
import type { CatalogosRepuesto, Repuesto, RepuestoNuevo } from '@/types/repuesto'
import {
  aEntero,
  aNumero,
  textoONull,
  validarCantidad,
  validarEnteroNoNegativo,
  validarLargoMaximo,
  validarMonto,
  validarObligatorio,
} from '@/utils/validaciones'

const props = defineProps<{
  /** Los repuestos que ya existen: si el código escrito es de uno de ellos, solo se suma stock. */
  repuestos: Repuesto[]
  /** Opciones de los `<select>`. */
  catalogos: CatalogosRepuesto
  /** Código ya elegido (desde el botón de una fila): se muestra bloqueado. */
  codigoInicial?: string
  /** Hay una petición en curso: se deshabilitan los botones. */
  enviando?: boolean
}>()

const emit = defineEmits<{
  /** Datos ya validados. Si el repuesto ya existe, lleva sus datos actuales. */
  enviar: [datos: RepuestoNuevo]
  cancelar: []
}>()

// Los valores iniciales se leen una vez: la view recrea el formulario (`:key`) si cambian.
const formulario = reactive({
  codigo: props.codigoInicial ?? '',
  descripcion: '',
  precio: '',
  stockMinimo: '0',
  marca: '',
  categoria: '',
  bodega: '',
  cantidad: '',
  ubicacion: '',
})

/**
 * El repuesto con ese código, si ya existe. La base compara los códigos sin distinguir mayúsculas,
 * así que aquí también: escribir "g7345" encuentra "G7345" en vez de crear un duplicado.
 */
const existente = computed(() => {
  const buscado = formulario.codigo.trim().toLowerCase()
  if (buscado === '') return undefined
  return props.repuestos.find((repuesto) => repuesto.codigo_oe.toLowerCase() === buscado)
})

// Los errores de campo solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errores = computed(() => {
  if (!intentoEnvio.value) return null
  // Los datos del repuesto solo se piden (y se validan) si es nuevo.
  const esNuevo = existente.value === undefined
  return {
    codigo:
      validarObligatorio(formulario.codigo, 'Escribe el código OE') ??
      validarLargoMaximo(formulario.codigo, 45, 'El código'),
    descripcion: esNuevo
      ? (validarObligatorio(formulario.descripcion, 'Escribe la descripción') ??
        validarLargoMaximo(formulario.descripcion, 150, 'La descripción'))
      : null,
    precio: esNuevo ? validarMonto(formulario.precio, 'El precio') : null,
    stockMinimo: esNuevo
      ? validarEnteroNoNegativo(formulario.stockMinimo, 'El stock mínimo')
      : null,
    marca: esNuevo ? validarObligatorio(formulario.marca, 'Elige la marca') : null,
    categoria: esNuevo ? validarObligatorio(formulario.categoria, 'Elige la categoría') : null,
    bodega: validarObligatorio(formulario.bodega, 'Elige la bodega'),
    cantidad: validarCantidad(formulario.cantidad),
    ubicacion: validarLargoMaximo(formulario.ubicacion, 45, 'La ubicación'),
  }
})

function mensajeDe(campo: keyof NonNullable<typeof errores.value>): string | null {
  return errores.value?.[campo] ?? null
}

function enviar(): void {
  intentoEnvio.value = true
  if (!errores.value || Object.values(errores.value).some((error) => error !== null)) return

  // Si ya existe se mandan sus datos tal cual están: el procedure solo suma stock y no los toca.
  // (Los `?? 0` de abajo no se alcanzan: la validación de arriba ya garantizó que son números.)
  const base = existente.value
  emit('enviar', {
    codigo_oe: base?.codigo_oe ?? formulario.codigo.trim(),
    descripcion: base?.descripcion ?? formulario.descripcion.trim(),
    precio_venta: base?.precio_venta ?? aNumero(formulario.precio) ?? 0,
    stock_minimo: base?.stock_minimo ?? aEntero(formulario.stockMinimo) ?? 0,
    codigo_marca: base?.tMarca_codigo_marca ?? formulario.marca,
    codigo_categoria: base?.tCategoria_codigo_categoria ?? formulario.categoria,
    codigo_bodega: formulario.bodega,
    cantidad: aEntero(formulario.cantidad) ?? 0,
    ubicacion: textoONull(formulario.ubicacion),
  })
}
</script>

<template>
  <form class="d-flex flex-column flex-grow-1" novalidate @submit.prevent="enviar">
    <FormField
      id="repuesto-codigo"
      etiqueta="Código OE"
      :error="mensajeDe('codigo')"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="repuesto-codigo"
        v-model="formulario.codigo"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
        :disabled="Boolean(codigoInicial)"
      />
    </FormField>

    <!-- Un código que ya existe solo suma stock: no se piden (ni se pueden cambiar) sus datos -->
    <div v-if="existente" class="alert alert-info" role="status">
      <AppIcon nombre="info-circle" />
      <div>
        <span class="alert__title">Este repuesto ya existe</span>
        {{ existente.descripcion }}. Se suma stock y sus datos no cambian.
      </div>
    </div>

    <template v-else>
      <FormField
        id="repuesto-descripcion"
        etiqueta="Descripción"
        :error="mensajeDe('descripcion')"
        v-slot="{ invalido, describedby }"
      >
        <input
          id="repuesto-descripcion"
          v-model="formulario.descripcion"
          type="text"
          autocomplete="off"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        />
      </FormField>

      <div class="row g-3">
        <div class="col-6">
          <FormField
            id="repuesto-precio"
            etiqueta="Precio de venta"
            :error="mensajeDe('precio')"
            v-slot="{ invalido, describedby }"
          >
            <input
              id="repuesto-precio"
              v-model="formulario.precio"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0,00"
              class="form-control form-control-lg"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
            />
          </FormField>
        </div>
        <div class="col-6">
          <FormField
            id="repuesto-stock-minimo"
            etiqueta="Stock mínimo"
            :error="mensajeDe('stockMinimo')"
            v-slot="{ invalido, describedby }"
          >
            <input
              id="repuesto-stock-minimo"
              v-model="formulario.stockMinimo"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              class="form-control form-control-lg"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
            />
          </FormField>
        </div>
      </div>

      <FormField
        id="repuesto-marca"
        etiqueta="Marca"
        :error="mensajeDe('marca')"
        v-slot="{ invalido, describedby }"
      >
        <select
          id="repuesto-marca"
          v-model="formulario.marca"
          class="form-select form-select-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        >
          <option value="" disabled>Elige una marca</option>
          <option v-for="marca in catalogos.marcas" :key="marca.codigo" :value="marca.codigo">
            {{ marca.nombre }}
          </option>
        </select>
      </FormField>

      <FormField
        id="repuesto-categoria"
        etiqueta="Categoría"
        :error="mensajeDe('categoria')"
        v-slot="{ invalido, describedby }"
      >
        <select
          id="repuesto-categoria"
          v-model="formulario.categoria"
          class="form-select form-select-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        >
          <option value="" disabled>Elige una categoría</option>
          <option
            v-for="categoria in catalogos.categorias"
            :key="categoria.codigo"
            :value="categoria.codigo"
          >
            {{ categoria.nombre }}
          </option>
        </select>
      </FormField>
    </template>

    <div class="cc-sidepanel__section pb-1">
      <FormField
        id="repuesto-bodega"
        etiqueta="Bodega donde entra"
        :error="mensajeDe('bodega')"
        v-slot="{ invalido, describedby }"
      >
        <select
          id="repuesto-bodega"
          v-model="formulario.bodega"
          class="form-select form-select-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        >
          <option value="" disabled>Elige una bodega</option>
          <option v-for="bodega in catalogos.bodegas" :key="bodega.codigo" :value="bodega.codigo">
            {{ bodega.nombre }}
          </option>
        </select>
      </FormField>

      <div class="row g-3">
        <div class="col-6">
          <FormField
            id="repuesto-cantidad"
            etiqueta="Cantidad"
            :error="mensajeDe('cantidad')"
            v-slot="{ invalido, describedby }"
          >
            <input
              id="repuesto-cantidad"
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
            id="repuesto-ubicacion"
            etiqueta="Ubicación (opcional)"
            :error="mensajeDe('ubicacion')"
            v-slot="{ invalido, describedby }"
          >
            <input
              id="repuesto-ubicacion"
              v-model="formulario.ubicacion"
              type="text"
              autocomplete="off"
              placeholder="A-01-1"
              class="form-control form-control-lg"
              :class="{ 'is-invalid': invalido }"
              :aria-describedby="describedby"
            />
          </FormField>
        </div>
      </div>
    </div>

    <div class="cc-form-actions">
      <button type="button" class="btn btn-neutral" :disabled="enviando" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        Ingresar repuesto
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import FormField from '@/components/common/FormField.vue'
import { TIPO_IDENTIFICACION } from '@/types/cliente'
import type { CatalogosCliente, Cliente, ClienteNuevo } from '@/types/cliente'
import {
  textoONull,
  validarEmail,
  validarIdentificacion,
  validarLargoMaximo,
  validarObligatorio,
} from '@/utils/validaciones'

const props = defineProps<{
  /** Cliente que se edita. Sin él, el formulario es de un cliente nuevo. */
  cliente?: Cliente | null
  /** Opciones de los `<select>`. */
  catalogos: CatalogosCliente
  /** Hay una petición en curso: se deshabilitan los botones. */
  enviando?: boolean
}>()

const emit = defineEmits<{
  /** Datos ya validados, con los campos opcionales vacíos como `null`. */
  enviar: [datos: ClienteNuevo]
  cancelar: []
}>()

const esEdicion = computed(() => Boolean(props.cliente))

// Los valores iniciales se leen una vez: la view recrea el formulario (`:key`) si cambia el cliente.
const formulario = reactive({
  tipo: props.cliente?.tTipoIdentificacion_codigo_tipo_identificacion ?? '',
  numero: props.cliente?.numero_identificacion ?? '',
  razonSocial: props.cliente?.razon_social ?? '',
  telefono: props.cliente?.telefono ?? '',
  email: props.cliente?.email ?? '',
  direccion: props.cliente?.direccion ?? '',
  ciudad: props.cliente?.tCiudad_codigo_ciudad ?? '',
})

// `registrar_cliente` rechaza el consumidor final: no se ofrece como tipo.
const tiposDisponibles = computed(() =>
  props.catalogos.tiposIdentificacion.filter(
    (tipo) => tipo.codigo !== TIPO_IDENTIFICACION.CONSUMIDOR_FINAL,
  ),
)

const ayudaIdentificacion = computed(() => {
  if (formulario.tipo === TIPO_IDENTIFICACION.RUC) return '13 dígitos'
  if (formulario.tipo === TIPO_IDENTIFICACION.CEDULA) return '10 dígitos'
  return 'Elige primero el tipo'
})

// Los errores de campo solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errores = computed(() => {
  if (!intentoEnvio.value) {
    return {
      tipo: null,
      numero: null,
      razonSocial: null,
      telefono: null,
      email: null,
      direccion: null,
    }
  }
  return {
    tipo: validarObligatorio(formulario.tipo, 'Elige el tipo de identificación'),
    numero: validarIdentificacion(formulario.tipo, formulario.numero),
    razonSocial:
      validarObligatorio(formulario.razonSocial, 'Escribe el nombre o la razón social') ??
      validarLargoMaximo(formulario.razonSocial, 150, 'El nombre'),
    telefono: validarLargoMaximo(formulario.telefono, 45, 'El teléfono'),
    email: validarEmail(formulario.email) ?? validarLargoMaximo(formulario.email, 100, 'El email'),
    direccion: validarLargoMaximo(formulario.direccion, 200, 'La dirección'),
  }
})

function enviar(): void {
  intentoEnvio.value = true
  if (Object.values(errores.value).some((error) => error !== null)) return

  emit('enviar', {
    numero_identificacion: formulario.numero.trim(),
    codigo_tipo: formulario.tipo,
    razon_social: formulario.razonSocial.trim(),
    telefono: textoONull(formulario.telefono),
    email: textoONull(formulario.email),
    direccion: textoONull(formulario.direccion),
    codigo_ciudad: textoONull(formulario.ciudad),
  })
}
</script>

<template>
  <form class="d-flex flex-column flex-grow-1" novalidate @submit.prevent="enviar">
    <p v-if="esEdicion" class="form-text mb-3">
      Los campos que dejes vacíos conservan su valor actual.
    </p>

    <FormField
      id="cliente-tipo"
      etiqueta="Tipo de identificación"
      :error="errores.tipo"
      v-slot="{ invalido, describedby }"
    >
      <select
        id="cliente-tipo"
        v-model="formulario.tipo"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
        :disabled="esEdicion"
      >
        <option value="" disabled>Elige un tipo</option>
        <option v-for="tipo in tiposDisponibles" :key="tipo.codigo" :value="tipo.codigo">
          {{ tipo.nombre }}
        </option>
      </select>
    </FormField>

    <FormField
      id="cliente-numero"
      etiqueta="Número de identificación"
      :error="errores.numero"
      :ayuda="ayudaIdentificacion"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="cliente-numero"
        v-model="formulario.numero"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        maxlength="13"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
        :disabled="esEdicion"
      />
    </FormField>

    <FormField
      id="cliente-razon-social"
      etiqueta="Nombre o razón social"
      :error="errores.razonSocial"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="cliente-razon-social"
        v-model="formulario.razonSocial"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="cliente-telefono"
      etiqueta="Teléfono (opcional)"
      :error="errores.telefono"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="cliente-telefono"
        v-model="formulario.telefono"
        type="tel"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="cliente-email"
      etiqueta="Email (opcional)"
      :error="errores.email"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="cliente-email"
        v-model="formulario.email"
        type="email"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="cliente-direccion"
      etiqueta="Dirección (opcional)"
      :error="errores.direccion"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="cliente-direccion"
        v-model="formulario.direccion"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField id="cliente-ciudad" etiqueta="Ciudad (opcional)" v-slot="{ describedby }">
      <select
        id="cliente-ciudad"
        v-model="formulario.ciudad"
        class="form-select form-select-lg"
        :aria-describedby="describedby"
      >
        <option value="">Sin ciudad</option>
        <option v-for="ciudad in catalogos.ciudades" :key="ciudad.codigo" :value="ciudad.codigo">
          {{ ciudad.nombre }}
        </option>
      </select>
    </FormField>

    <div class="cc-form-actions">
      <button type="button" class="btn btn-neutral" :disabled="enviando" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        {{ esEdicion ? 'Guardar cambios' : 'Guardar cliente' }}
      </button>
    </div>
  </form>
</template>

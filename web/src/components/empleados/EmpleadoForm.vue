<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import FormField from '@/components/common/FormField.vue'
import type { ItemCatalogo } from '@/types/catalogo'
import type { EmpleadoNuevo } from '@/types/empleado'
import { validarLargoMaximo, validarObligatorio } from '@/utils/validaciones'

defineProps<{
  /** Roles entre los que se puede elegir (catálogo `roles`; el código es un número). */
  roles: ItemCatalogo<number>[]
  /** Hay una petición en curso: se deshabilitan los botones. */
  enviando?: boolean
}>()

const emit = defineEmits<{
  /** Datos ya validados. `contrasena` va en texto plano: la hashea el API, no el front. */
  enviar: [datos: EmpleadoNuevo]
  cancelar: []
}>()

const formulario = reactive({
  codigo: '',
  cedula: '',
  nombres: '',
  apellidos: '',
  rol: '' as number | '',
  usuario: '',
  contrasena: '',
  repetirContrasena: '',
})

// Los errores de campo solo aparecen después del primer intento de enviar.
const intentoEnvio = ref(false)

const errores = computed(() => {
  if (!intentoEnvio.value) {
    return {
      codigo: null,
      cedula: null,
      nombres: null,
      apellidos: null,
      rol: null,
      usuario: null,
      contrasena: null,
      repetirContrasena: null,
    }
  }
  return {
    codigo:
      validarObligatorio(formulario.codigo, 'Escribe el código del empleado') ??
      validarLargoMaximo(formulario.codigo, 45, 'El código'),
    // Mismo criterio que `contratar_empleado`: exactamente 10 dígitos.
    cedula: /^\d{10}$/.test(formulario.cedula.trim()) ? null : 'La cédula tiene 10 dígitos',
    nombres:
      validarObligatorio(formulario.nombres, 'Escribe los nombres') ??
      validarLargoMaximo(formulario.nombres, 45, 'Los nombres'),
    apellidos:
      validarObligatorio(formulario.apellidos, 'Escribe los apellidos') ??
      validarLargoMaximo(formulario.apellidos, 45, 'Los apellidos'),
    rol: formulario.rol === '' ? 'Elige el rol' : null,
    usuario:
      validarObligatorio(formulario.usuario, 'Escribe el usuario') ??
      validarLargoMaximo(formulario.usuario, 45, 'El usuario'),
    // La contraseña no se recorta: un espacio al final es parte de ella.
    contrasena: formulario.contrasena === '' ? 'Escribe una contraseña' : null,
    repetirContrasena:
      formulario.repetirContrasena !== formulario.contrasena
        ? 'Las contraseñas no coinciden'
        : null,
  }
})

function enviar(): void {
  intentoEnvio.value = true
  if (Object.values(errores.value).some((error) => error !== null)) return
  // `rol` ya se validó: no puede ser ''.
  if (formulario.rol === '') return

  emit('enviar', {
    codigo_empleado: formulario.codigo.trim(),
    cedula: formulario.cedula.trim(),
    nombres: formulario.nombres.trim(),
    apellidos: formulario.apellidos.trim(),
    codigo_rol: formulario.rol,
    usuario: formulario.usuario.trim(),
    contrasena: formulario.contrasena,
  })
}
</script>

<template>
  <form class="d-flex flex-column flex-grow-1" novalidate @submit.prevent="enviar">
    <FormField
      id="empleado-codigo"
      etiqueta="Código del empleado"
      :error="errores.codigo"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="empleado-codigo"
        v-model="formulario.codigo"
        type="text"
        autocomplete="off"
        placeholder="E011"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="empleado-cedula"
      etiqueta="Cédula"
      :error="errores.cedula"
      ayuda="10 dígitos. Si es de un empleado dado de baja, se lo recontrata."
      v-slot="{ invalido, describedby }"
    >
      <input
        id="empleado-cedula"
        v-model="formulario.cedula"
        type="text"
        inputmode="numeric"
        maxlength="10"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="empleado-nombres"
      etiqueta="Nombres"
      :error="errores.nombres"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="empleado-nombres"
        v-model="formulario.nombres"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="empleado-apellidos"
      etiqueta="Apellidos"
      :error="errores.apellidos"
      v-slot="{ invalido, describedby }"
    >
      <input
        id="empleado-apellidos"
        v-model="formulario.apellidos"
        type="text"
        autocomplete="off"
        class="form-control form-control-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField
      id="empleado-rol"
      etiqueta="Rol"
      :error="errores.rol"
      v-slot="{ invalido, describedby }"
    >
      <select
        id="empleado-rol"
        v-model="formulario.rol"
        class="form-select form-select-lg"
        :class="{ 'is-invalid': invalido }"
        :aria-describedby="describedby"
      >
        <option value="" disabled>Elige un rol</option>
        <option v-for="rol in roles" :key="rol.codigo" :value="rol.codigo">
          {{ rol.nombre }}
        </option>
      </select>
    </FormField>

    <div class="cc-sidepanel__section pb-1">
      <FormField
        id="empleado-usuario"
        etiqueta="Usuario"
        :error="errores.usuario"
        v-slot="{ invalido, describedby }"
      >
        <input
          id="empleado-usuario"
          v-model="formulario.usuario"
          type="text"
          autocomplete="off"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        />
      </FormField>

      <FormField
        id="empleado-contrasena"
        etiqueta="Contraseña"
        :error="errores.contrasena"
        v-slot="{ invalido, describedby }"
      >
        <input
          id="empleado-contrasena"
          v-model="formulario.contrasena"
          type="password"
          autocomplete="new-password"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        />
      </FormField>

      <FormField
        id="empleado-repetir-contrasena"
        etiqueta="Repetir contraseña"
        :error="errores.repetirContrasena"
        v-slot="{ invalido, describedby }"
      >
        <input
          id="empleado-repetir-contrasena"
          v-model="formulario.repetirContrasena"
          type="password"
          autocomplete="new-password"
          class="form-control form-control-lg"
          :class="{ 'is-invalid': invalido }"
          :aria-describedby="describedby"
        />
      </FormField>
    </div>

    <div class="cc-form-actions">
      <button type="button" class="btn btn-neutral" :disabled="enviando" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        Contratar empleado
      </button>
    </div>
  </form>
</template>

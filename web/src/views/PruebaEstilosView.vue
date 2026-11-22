<script setup lang="ts">
// TEMPORAL (Pausa 1): compara los estilos con design/system.html. Se borra en el bloque G2.
import logoUrl from '@/assets/logo.jpg'
</script>

<template>
  <main class="bg-body-tertiary min-vh-100 p-4">
    <div class="container" style="max-width: 720px">
      <img :src="logoUrl" alt="Carlitos & Co" height="40" class="mb-4" />

      <div class="card">
        <div class="card-body">
          <h1 class="h2">Vista de prueba</h1>
          <p class="text-body-secondary">
            Botones, input y tarjeta, para comparar con system.html.
          </p>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <button type="button" class="btn btn-primary">Primario</button>
            <button type="button" class="btn btn-neutral">Neutro</button>
            <button type="button" class="btn btn-accent">Generar reporte PDF</button>
            <button type="button" class="btn btn-primary" disabled>Deshabilitado</button>
          </div>

          <div class="mb-3">
            <label for="prueba-nombre" class="form-label">Nombre</label>
            <input id="prueba-nombre" type="text" class="form-control" placeholder="Escribe aquí" />
          </div>

          <p class="mb-0">
            <i class="bi bi-box-seam me-1" aria-hidden="true"></i>
            Ícono de Bootstrap Icons
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

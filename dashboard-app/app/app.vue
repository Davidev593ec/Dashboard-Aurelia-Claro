<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { loadFromStorage } = useAuth()

// Cargar auth desde localStorage ANTES de montar
if (process.client) {
  loadFromStorage()
}
</script>

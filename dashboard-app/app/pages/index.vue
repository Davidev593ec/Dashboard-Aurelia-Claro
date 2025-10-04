<script setup>
const { isAuthenticated } = useAuth()

onMounted(() => {
  if (!isAuthenticated.value) {
    navigateTo('/login')
  } else {
    navigateTo('/turnos')
  }
})
</script>

<template>
  <div></div>
</template>

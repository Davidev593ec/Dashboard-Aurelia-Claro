<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="isOpen"
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-open': isOpen }]">
      <div class="sidebar-header">
        <h2>Estadísticas</h2>
        <button @click="toggleSidebar" class="close-btn">✕</button>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink to="/" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">
            <img src="~/assets/icons/counter.svg" alt="Resumen" style="width: 20px; height: 20px;" />
          </span>
          <span class="nav-text">Resumen</span>
        </NuxtLink>

        <NuxtLink to="/turnos" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">
            <img src="~/assets/icons/ticket.svg" alt="Turnos" style="width: 20px; height: 20px;" />
          </span>
          <span class="nav-text">Turnos</span>
        </NuxtLink>

        <NuxtLink to="/encuestas" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">
            <img src="~/assets/icons/survey.svg" alt="Encuestas" style="width: 20px; height: 20px;" />
          </span>
          <span class="nav-text">Encuestas</span>
        </NuxtLink>

        <NuxtLink to="/monitoreo" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">
            <img src="~/assets/icons/monitor.svg" alt="Monitoreo" style="width: 20px; height: 20px;" />
          </span>
          <span class="nav-text">Monitoreo</span>
        </NuxtLink>

        <NuxtLink to="/analytics" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">
            <img src="~/assets/icons/statics.svg" alt="Analytics" style="width: 20px; height: 20px;" />
          </span>
          <span class="nav-text">Analytics</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Toggle Button -->
    <button
      v-if="!isOpen"
      @click="toggleSidebar"
      class="sidebar-toggle"
    >
      ☰
    </button>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false)

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const closeSidebar = () => {
  isOpen.value = false
}
</script>

<style lang="stylus" scoped>
.sidebar-overlay
  position fixed
  top 0
  left 0
  width 100%
  height 100%
  background rgba(0, 0, 0, 0.5)
  z-index 998

.sidebar
  position fixed
  top 0
  left -280px
  width 280px
  height 100vh
  background white
  box-shadow 2px 0 10px rgba(0, 0, 0, 0.1)
  transition left 0.3s ease
  z-index 999
  display flex
  flex-direction column

  &.sidebar-open
    left 0

  .sidebar-header
    padding 24px 20px
    background #e30613
    color white
    display flex
    justify-content space-between
    align-items center

    h2
      margin 0
      font-size 24px
      font-weight 700
      letter-spacing -0.5px

    .close-btn
      background transparent
      border none
      color white
      font-size 24px
      cursor pointer
      padding 0
      width 30px
      height 30px
      display flex
      align-items center
      justify-content center
      transition all 0.2s ease

      &:hover
        background rgba(255, 255, 255, 0.2)
        border-radius 4px

  .sidebar-nav
    flex 1
    padding 20px 0

    .nav-item
      display flex
      align-items center
      padding 16px 24px
      color #333
      text-decoration none
      transition all 0.2s ease
      cursor pointer
      border-left 4px solid transparent

      &:hover
        background #f8f9fa
        border-left-color #e30613

      &.router-link-active
        background #f8f9fa
        border-left-color #e30613
        color #e30613
        font-weight 600

      .nav-icon
        font-size 20px
        margin-right 12px
        width 24px
        display flex
        align-items center
        justify-content center

      .nav-text
        font-size 15px

.sidebar-toggle
  position fixed
  top 80px
  left 20px
  width 50px
  height 50px
  background #ff6b6b
  color white
  border none
  border-radius 50%
  font-size 24px
  cursor pointer
  box-shadow 0 4px 12px rgba(255, 107, 107, 0.3)
  z-index 997
  display flex
  align-items center
  justify-content center
  transition all 0.3s ease

  &:hover
    background #ff5252
    transform scale(1.05)
    box-shadow 0 6px 16px rgba(255, 82, 82, 0.4)

  @media (max-width: 768px)
    width 45px
    height 45px
    font-size 20px
    top 70px
    left 16px
</style>

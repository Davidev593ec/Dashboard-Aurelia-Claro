<template>
  <div class="dashboard">
    <Sidebar />
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard Aurelia - Resumen General</h1>
        <div class="header-actions">
          <span class="user-info">{{ user?.name || user?.email }}</span>
          <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    </header>

    <div class="dashboard-content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando resumen general...</p>
      </div>

      <template v-else>
        <!-- Segmentos -->
        <section class="segments-section">
          <h2>Segmentos del Dashboard</h2>
          <div class="segments-grid">
            <!-- Card de Turnos -->
            <div
              class="segment-card"
              :class="data.segmentos.turnos.estado"
              @click="navigateTo(data.segmentos.turnos.url)"
            >
              <div class="segment-header">
                <span class="segment-icon">
                  <img src="~/assets/icons/ticket.svg" alt="Turnos" style="width: 32px; height: 32px;" />
                </span>
                <h3>{{ data.segmentos.turnos.titulo }}</h3>
              </div>
              <div class="segment-stats">
                <div
                  v-for="(stat, index) in data.segmentos.turnos.stats"
                  :key="index"
                  class="stat-item"
                >
                  <span class="stat-label">{{ stat.label }}:</span>
                  <span class="stat-value">{{ formatStatValue(stat) }}</span>
                </div>
              </div>
              <div class="segment-footer">
                <span class="link-text">Ver más →</span>
              </div>
            </div>

            <!-- Card de Encuestas -->
            <div
              class="segment-card"
              :class="data.segmentos.encuestas.estado"
              @click="navigateTo(data.segmentos.encuestas.url)"
            >
              <div class="segment-header">
                <span class="segment-icon">
                  <img src="~/assets/icons/survey.svg" alt="Encuestas" style="width: 32px; height: 32px;" />
                </span>
                <h3>{{ data.segmentos.encuestas.titulo }}</h3>
              </div>
              <div class="segment-stats">
                <div
                  v-for="(stat, index) in data.segmentos.encuestas.stats"
                  :key="index"
                  class="stat-item"
                >
                  <span class="stat-label">{{ stat.label }}:</span>
                  <span class="stat-value">{{ formatStatValue(stat) }}</span>
                </div>
              </div>
              <div class="segment-footer">
                <span class="link-text">Ver más →</span>
              </div>
            </div>

            <!-- Card de Analytics -->
            <div
              class="segment-card"
              :class="data.segmentos.analytics.estado"
              @click="navigateTo(data.segmentos.analytics.url)"
            >
              <div class="segment-header">
                <span class="segment-icon">
                  <img src="~/assets/icons/statics.svg" alt="Analytics" style="width: 32px; height: 32px;" />
                </span>
                <h3>{{ data.segmentos.analytics.titulo }}</h3>
              </div>
              <div class="segment-stats">
                <div
                  v-for="(stat, index) in data.segmentos.analytics.stats"
                  :key="index"
                  class="stat-item"
                >
                  <span class="stat-label">{{ stat.label }}:</span>
                  <span class="stat-value">{{ formatStatValue(stat) }}</span>
                </div>
              </div>
              <div class="segment-footer">
                <span class="link-text">Ver más →</span>
              </div>
            </div>

            <!-- Card de Monitoreo -->
            <div
              class="segment-card"
              :class="data.segmentos.monitoreo.estado"
              @click="navigateTo(data.segmentos.monitoreo.url)"
            >
              <div class="segment-header">
                <span class="segment-icon">
                  <img src="~/assets/icons/monitor.svg" alt="Monitoreo" style="width: 32px; height: 32px;" />
                </span>
                <h3>{{ data.segmentos.monitoreo.titulo }}</h3>
              </div>
              <div class="segment-stats">
                <div
                  v-for="(stat, index) in data.segmentos.monitoreo.stats"
                  :key="index"
                  class="stat-item"
                >
                  <span class="stat-label">{{ stat.label }}:</span>
                  <span class="stat-value">{{ formatStatValue(stat) }}</span>
                </div>
              </div>
              <div class="segment-footer">
                <span class="link-text">Ver más →</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Alertas y Recomendaciones -->
        <section class="alerts-section" v-if="data.alertas.total > 0 || data.recomendaciones.length > 0">
          <div class="alerts-container">
            <!-- Alertas -->
            <div v-if="data.alertas.total > 0" class="alerts-box">
              <h3>
                <img src="~/assets/icons/warning.svg" alt="Alertas" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;" />
                Alertas Activas ({{ data.alertas.total }})
              </h3>
              <div class="alerts-list">
                <div
                  v-for="(alerta, index) in data.alertas.items"
                  :key="index"
                  class="alert-item"
                  :class="alerta.tipo"
                >
                  <span class="alert-icon">
                    <img v-if="alerta.tipo === 'error'" src="~/assets/icons/alert-high.svg" alt="Error" style="width: 18px; height: 18px;" />
                    <img v-else-if="alerta.tipo === 'warning'" src="~/assets/icons/warning.svg" alt="Advertencia" style="width: 18px; height: 18px;" />
                    <img v-else src="~/assets/icons/info.svg" alt="Info" style="width: 18px; height: 18px;" />
                  </span>
                  <span class="alert-message">{{ alerta.mensaje }}</span>
                </div>
              </div>
            </div>

            <!-- Recomendaciones -->
            <div v-if="data.recomendaciones.length > 0" class="recommendations-box">
              <h3>
                <img src="~/assets/icons/lightbulb.svg" alt="Recomendaciones" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;" />
                Recomendaciones ({{ data.recomendaciones.length }})
              </h3>
              <div class="recommendations-list">
                <div
                  v-for="(rec, index) in data.recomendaciones"
                  :key="index"
                  class="recommendation-item"
                  :class="rec.tipo"
                >
                  <span class="rec-message">{{ rec.mensaje }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout, isAuthenticated, token } = useAuth()

const loading = ref(true)
const data = ref<any>({
  kpis: {
    turnosHoy: 0,
    tasaAtencion: 0,
    npsPromedio: 0,
    tiempoPromedioMinutos: 0
  },
  segmentos: {},
  alertas: { total: 0, items: [] },
  recomendaciones: []
})

let refreshInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await nextTick()

  if (!isAuthenticated.value) {
    navigateTo('/login')
    return
  }

  await fetchData()

  // Auto-refresh cada 30 segundos
  refreshInterval = setInterval(() => {
    fetchData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

const fetchData = async () => {
  try {
    loading.value = true

    const resumenData = await $fetch('/api/resumen/general', {
      headers: {
        authorization: `Bearer ${token.value}`
      }
    })

    data.value = resumenData
  } catch (error) {
    console.error('Error al cargar resumen:', error)
  } finally {
    loading.value = false
  }
}

const formatStatValue = (stat: any) => {
  switch (stat.format) {
    case 'percentage':
      return `${stat.value.toFixed(1)}%`
    case 'decimal':
      return stat.value.toFixed(1)
    case 'number':
      return stat.value
    case 'text':
    default:
      return stat.value
  }
}

const handleLogout = () => {
  logout()
}
</script>

<style lang="stylus" scoped>
.dashboard
  min-height 100vh
  background #f8f9fa
  overflow-x hidden

.dashboard-header
  background #e30613
  border-bottom none
  box-shadow 0 4px 6px rgba(0, 0, 0, 0.1)
  position sticky
  top 0
  z-index 100

  .header-content
    max-width 1400px
    margin 0 auto
    padding 20px 40px
    display flex
    justify-content space-between
    align-items center

    @media (max-width: 1024px)
      padding 20px
      flex-direction column
      align-items flex-start
      gap 16px

    h1
      font-size 26px
      color white
      margin 0
      font-weight 700
      letter-spacing -0.5px

      @media (max-width: 768px)
        font-size 20px

    .header-actions
      display flex
      align-items center
      gap 20px

      @media (max-width: 768px)
        gap 12px
        width 100%
        justify-content flex-end

      .user-info
        color white
        font-size 14px
        font-weight 500

        @media (max-width: 768px)
          font-size 12px

      .btn-logout
        padding 10px 24px
        background rgba(255, 255, 255, 0.2)
        color white
        border 2px solid white
        border-radius 50px
        cursor pointer
        font-size 14px
        font-weight 600
        transition all 0.3s ease

        @media (max-width: 768px)
          font-size 12px
          padding 8px 16px

        &:hover
          background white
          color #e30613
          transform translateY(-2px)

.dashboard-content
  max-width 1400px
  margin 0 auto
  padding 40px

  @media (max-width: 768px)
    padding 20px

.loading
  text-align center
  padding 80px 20px

  .spinner
    width 50px
    height 50px
    border 4px solid #e0e0e0
    border-top-color #e30613
    border-radius 50%
    animation spin 1s linear infinite
    margin 0 auto 20px

  p
    color #666

@keyframes spin
  to
    transform rotate(360deg)

// Segments Section
.segments-section
  margin-bottom 40px

  h2
    font-size 20px
    color #333
    margin-bottom 20px
    font-weight 600

  .segments-grid
    display grid
    grid-template-columns repeat(auto-fill, minmax(300px, 1fr))
    gap 20px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .segment-card
      background white
      border-radius 12px
      padding 24px
      box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
      cursor pointer
      transition all 0.3s ease
      border-left 4px solid #e30613

      &.excelente
        border-left-color #2ecc71

      &.bueno
        border-left-color #3498db

      &.regular
        border-left-color #f39c12

      &.info
        border-left-color #95a5a6

      &:hover
        transform translateY(-4px)
        box-shadow 0 6px 16px rgba(0, 0, 0, 0.12)

      .segment-header
        display flex
        align-items center
        gap 12px
        margin-bottom 16px
        position relative

        &.disabled
          opacity 0.7

        .segment-icon
          font-size 32px
          line-height 1

        h3
          margin 0
          font-size 18px
          color #333
          font-weight 600
          flex 1

        .badge-soon
          position absolute
          top 0
          right 0
          background #f39c12
          color white
          font-size 10px
          padding 4px 8px
          border-radius 10px
          font-weight 700

      .segment-stats
        margin-bottom 16px

        .stat-item
          display flex
          justify-content space-between
          margin-bottom 8px
          font-size 13px

          &:last-child
            margin-bottom 0

          .stat-label
            color #666
            font-weight 500

          .stat-value
            color #333
            font-weight 600

      .segment-footer
        padding-top 12px
        border-top 1px solid #f0f0f0

        .link-text
          color #e30613
          font-size 13px
          font-weight 600
          display flex
          align-items center
          gap 4px

          &.disabled
            color #999
            cursor not-allowed

// Alerts Section
.alerts-section
  margin-bottom 40px

  .alerts-container
    display grid
    grid-template-columns repeat(auto-fit, minmax(400px, 1fr))
    gap 20px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .alerts-box,
    .recommendations-box
      background white
      border-radius 12px
      padding 24px
      box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)

      h3
        margin 0 0 16px 0
        font-size 16px
        color #333
        font-weight 600

      .alerts-list,
      .recommendations-list
        display flex
        flex-direction column
        gap 12px

        .alert-item,
        .recommendation-item
          padding 12px
          border-radius 8px
          display flex
          align-items center
          gap 12px
          font-size 13px

          &.error
            background #fee
            border-left 3px solid #e74c3c

          &.warning
            background #fff9e6
            border-left 3px solid #f39c12

          &.info
            background #e3f2fd
            border-left 3px solid #2196f3

          &.urgente
            background #fee
            border-left 3px solid #e74c3c

          .alert-icon
            font-size 18px
            line-height 1

          .alert-message,
          .rec-message
            flex 1
            color #333
            line-height 1.4
</style>

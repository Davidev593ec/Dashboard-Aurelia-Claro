<template>
  <div class="dashboard">
    <Sidebar />
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard Aurelia - Monitoreo en Tiempo Real</h1>
        <div class="header-actions">
          <span class="user-info">{{ user?.name || user?.email }}</span>
          <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    </header>

    <div class="dashboard-content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos en tiempo real...</p>
      </div>

      <template v-else>
        <!-- Estado del Sistema -->
        <section class="system-status">
          <div class="status-header">
            <h2>Estado del Sistema</h2>
            <div class="auto-refresh">
              <span class="refresh-indicator" :class="{ active: isRefreshing }"></span>
              <span class="refresh-text">Auto-actualización cada 30s</span>
            </div>
          </div>

          <div class="status-grid">
            <div class="status-card" :class="getStatusClass(data.estadoSistema)">
              <div class="status-icon">
                <img v-if="data.estadoSistema === 'normal'" src="~/assets/icons/check.svg" alt="Normal" style="width: 32px; height: 32px;" />
                <img v-else-if="data.estadoSistema === 'advertencia'" src="~/assets/icons/warning.svg" alt="Advertencia" style="width: 32px; height: 32px;" />
                <img v-else src="~/assets/icons/alert-high.svg" alt="Crítico" style="width: 32px; height: 32px;" />
              </div>
              <div class="status-info">
                <h3>{{ data.estadoSistema?.toUpperCase() }}</h3>
                <p>Estado General</p>
              </div>
            </div>

            <div class="status-card">
              <div class="status-icon">
                <img src="~/assets/icons/ticket.svg" alt="Turnos" style="width: 32px; height: 32px;" />
              </div>
              <div class="status-info">
                <h3>{{ data.turnosHoy || 0 }}</h3>
                <p>Turnos Hoy</p>
              </div>
            </div>

            <div class="status-card">
              <div class="status-icon">
                <img src="~/assets/icons/clock.svg" alt="Tiempo" style="width: 32px; height: 32px;" />
              </div>
              <div class="status-info">
                <h3>{{ formatTime(data.tiempoEsperaActual) }}</h3>
                <p>Tiempo Espera Actual</p>
              </div>
            </div>

            <div class="status-card">
              <div class="status-icon">
                <img src="~/assets/icons/user.svg" alt="Fila" style="width: 32px; height: 32px;" />
              </div>
              <div class="status-info">
                <h3>{{ data.filaEspera || 0 }}</h3>
                <p>En Fila de Espera</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Tótems Activos -->
        <section class="totems-section">
          <h3>Tótems Activos</h3>
          <div class="totems-grid">
            <div v-for="totem in data.totems" :key="totem.id" class="totem-card">
              <div class="totem-header">
                <h4>{{ totem.codigo }}</h4>
                <span class="totem-status" :class="totem.estado">
                  <img v-if="totem.estado === 'activo'" src="~/assets/icons/alert-low.svg" alt="Activo" style="width: 20px; height: 20px;" />
                  <img v-else src="~/assets/icons/alert-high.svg" alt="Inactivo" style="width: 20px; height: 20px;" />
                </span>
              </div>
              <div class="totem-stats">
                <div class="totem-stat">
                  <span class="label">CAC:</span>
                  <span class="value">{{ totem.cac?.nombre }}</span>
                </div>
                <div class="totem-stat">
                  <span class="label">Última actividad:</span>
                  <span class="value">{{ formatDateTime(totem.ultimaActividad) }}</span>
                </div>
                <div class="totem-stat">
                  <span class="label">Transacciones hoy:</span>
                  <span class="value">{{ totem.transaccionesHoy || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Métricas Detalladas de Tótems -->
        <section class="totem-metrics-section" v-if="metricsData.totems && metricsData.totems.length > 0">
          <div class="section-header">
            <h3>Métricas Detalladas de Tótems (Últimos 30 días)</h3>
            <div class="metrics-summary">
              <span class="summary-item">
                <strong>Uptime Promedio:</strong> {{ metricsData.resumen?.uptimePromedioGeneral?.toFixed(2) }}%
              </span>
              <span class="summary-item">
                <strong>Total Turnos:</strong> {{ metricsData.resumen?.totalTransacciones?.toLocaleString() }}
              </span>
            </div>
          </div>

          <div class="totem-metrics-grid">
            <div v-for="totem in metricsData.totems" :key="totem.id" class="totem-metric-card">
              <div class="metric-card-header">
                <h4>{{ totem.codigo }}</h4>
                <span class="metric-badge" :class="getUptimeBadgeClass(totem.metricas.uptimePromedio)">
                  {{ totem.metricas.uptimePromedio }}% Uptime
                </span>
              </div>

              <div class="metric-card-body">
                <div class="metric-row">
                  <div class="metric-item">
                    <span class="metric-icon">
                      <img src="~/assets/icons/ticket.svg" alt="Turnos" style="width: 20px; height: 20px;" />
                    </span>
                    <div class="metric-details">
                      <span class="metric-label">Turnos</span>
                      <span class="metric-value">{{ totem.metricas.totalTransacciones?.toLocaleString() }}</span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <span class="metric-icon">
                      <img src="~/assets/icons/error.svg" alt="Errores" style="width: 20px; height: 20px;" />
                    </span>
                    <div class="metric-details">
                      <span class="metric-label">Errores</span>
                      <span class="metric-value error">{{ totem.metricas.totalErrores }}</span>
                    </div>
                  </div>
                </div>

                <div class="metric-row">
                  <div class="metric-item">
                    <span class="metric-icon">
                      <img src="~/assets/icons/warning.svg" alt="Tasa Error" style="width: 20px; height: 20px;" />
                    </span>
                    <div class="metric-details">
                      <span class="metric-label">Tasa de Error</span>
                      <span class="metric-value" :class="getErrorRateClass(totem.metricas.tasaError)">
                        {{ totem.metricas.tasaError?.toFixed(2) }}%
                      </span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <span class="metric-icon">
                      <img src="~/assets/icons/clock.svg" alt="Tiempo" style="width: 20px; height: 20px;" />
                    </span>
                    <div class="metric-details">
                      <span class="metric-label">Tiempo Respuesta</span>
                      <span class="metric-value">{{ (totem.metricas.tiempoPromedioRespuesta / 1000).toFixed(2) }}s</span>
                    </div>
                  </div>
                </div>

                <div class="metric-row">
                  <div class="metric-item full-width">
                    <span class="metric-icon">
                      <img src="~/assets/icons/statics.svg" alt="Calendario" style="width: 20px; height: 20px;" />
                    </span>
                    <div class="metric-details">
                      <span class="metric-label">Días de Registro</span>
                      <span class="metric-value">{{ totem.metricas.totalDias }} días</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="metric-card-footer">
                <span class="cac-label">{{ totem.cac }}</span>
                <span class="status-label" :class="totem.estado">{{ totem.estado }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Alertas y Recomendaciones -->
        <section class="alerts-section" v-if="data.alertas && data.alertas.length > 0">
          <h3>Alertas y Recomendaciones</h3>
          <div class="alerts-container">
            <div v-for="(alerta, index) in data.alertas" :key="index"
                 class="alert-card"
                 :class="alerta.nivel">
              <div class="alert-icon">
                <img v-if="alerta.nivel === 'critico'" src="~/assets/icons/alert-high.svg" alt="Crítico" style="width: 24px; height: 24px;" />
                <img v-else-if="alerta.nivel === 'advertencia'" src="~/assets/icons/warning.svg" alt="Advertencia" style="width: 24px; height: 24px;" />
                <img v-else src="~/assets/icons/info.svg" alt="Info" style="width: 24px; height: 24px;" />
              </div>
              <div class="alert-content">
                <h4>{{ alerta.tipo }}</h4>
                <p>{{ alerta.mensaje }}</p>
                <span class="alert-time">{{ formatRelativeTime(alerta.timestamp) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Métricas de Hoy -->
        <section class="today-metrics">
          <h3>Métricas del Día</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Tasa de Atención</div>
              <div class="metric-value" :class="getMetricClass(data.tasaAtencion)">
                {{ data.tasaAtencion?.toFixed(1) }}%
              </div>
              <div class="metric-trend">
                <span v-if="data.tasaAtencion >= 90">
                  <img src="~/assets/icons/trend-up.svg" alt="Excelente" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Excelente
                </span>
                <span v-else-if="data.tasaAtencion >= 80">
                  <img src="~/assets/icons/trend-flat.svg" alt="Normal" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Normal
                </span>
                <span v-else>
                  <img src="~/assets/icons/trend-down.svg" alt="Bajo" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Bajo objetivo
                </span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Tasa de Abandono</div>
              <div class="metric-value" :class="getMetricClass(100 - (data.tasaAbandono || 0))">
                {{ data.tasaAbandono?.toFixed(1) }}%
              </div>
              <div class="metric-trend">
                <span v-if="data.tasaAbandono <= 10">
                  <img src="~/assets/icons/trend-up.svg" alt="Excelente" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Excelente
                </span>
                <span v-else-if="data.tasaAbandono <= 20">
                  <img src="~/assets/icons/warning.svg" alt="Atención" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Atención
                </span>
                <span v-else>
                  <img src="~/assets/icons/alert-high.svg" alt="Crítico" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Crítico
                </span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Tiempo Promedio Espera</div>
              <div class="metric-value">{{ formatTime(data.tiempoPromedioEspera) }}</div>
              <div class="metric-trend">
                <span v-if="data.tiempoPromedioEspera <= 60">
                  <img src="~/assets/icons/trend-up.svg" alt="Excelente" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Excelente
                </span>
                <span v-else-if="data.tiempoPromedioEspera <= 120">
                  <img src="~/assets/icons/trend-flat.svg" alt="Normal" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Normal
                </span>
                <span v-else>
                  <img src="~/assets/icons/trend-down.svg" alt="Mejorar" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Por mejorar
                </span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Tiempo Promedio Atención</div>
              <div class="metric-value">{{ formatTime(data.tiempoPromedioAtencion) }}</div>
              <div class="metric-trend">
                <span v-if="data.tiempoPromedioAtencion <= 600">
                  <img src="~/assets/icons/trend-up.svg" alt="Eficiente" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Eficiente
                </span>
                <span v-else-if="data.tiempoPromedioAtencion <= 900">
                  <img src="~/assets/icons/trend-flat.svg" alt="Normal" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Normal
                </span>
                <span v-else>
                  <img src="~/assets/icons/trend-down.svg" alt="Lento" style="width: 18px; height: 18px; vertical-align: middle;" />
                  Lento
                </span>
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
const isRefreshing = ref(false)
const data = ref<any>({
  estadoSistema: 'normal',
  turnosHoy: 0,
  tiempoEsperaActual: 0,
  filaEspera: 0,
  totems: [],
  alertas: [],
  tasaAtencion: 0,
  tasaAbandono: 0,
  tiempoPromedioEspera: 0,
  tiempoPromedioAtencion: 0
})

const metricsData = ref<any>({
  totems: [],
  resumen: {}
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
  refreshInterval = setInterval(async () => {
    isRefreshing.value = true
    await fetchData()
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
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

    // Obtener datos en tiempo real y métricas en paralelo
    const [tiempoRealData, totemMetricsData] = await Promise.all([
      $fetch('/api/analytics/tiempo-real', {
        headers: {
          authorization: `Bearer ${token.value}`
        }
      }),
      $fetch('/api/totems/metricas', {
        headers: {
          authorization: `Bearer ${token.value}`
        }
      })
    ])

    // Mapear datos de la API a la estructura del componente
    data.value = {
      estadoSistema: tiempoRealData.indicadores.estadoGeneral,
      turnosHoy: tiempoRealData.resumen.turnosHoy,
      tiempoEsperaActual: tiempoRealData.resumen.tiempoEsperaPromedio,
      filaEspera: tiempoRealData.resumen.turnosEnCola,
      totems: tiempoRealData.totems.detalle,
      alertas: tiempoRealData.alertas.activas.map((a: any) => ({
        nivel: a.tipo === 'error' ? 'critico' : a.tipo === 'warning' ? 'advertencia' : 'info',
        tipo: a.id,
        mensaje: a.mensaje,
        timestamp: a.timestamp
      })),
      tasaAtencion: tiempoRealData.resumen.turnosAtendidosHoy > 0
        ? (tiempoRealData.resumen.turnosAtendidosHoy / tiempoRealData.resumen.turnosHoy) * 100
        : 0,
      tasaAbandono: tiempoRealData.resumen.tasaAbandonoActual,
      tiempoPromedioEspera: tiempoRealData.resumen.tiempoEsperaPromedio,
      tiempoPromedioAtencion: tiempoRealData.resumen.tiempoAtencionPromedio
    }

    // Cargar métricas de tótems
    metricsData.value = totemMetricsData

  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (seconds: number) => {
  if (!seconds) return '0s'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
}

const formatDateTime = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRelativeTime = (timestamp: string | Date) => {
  if (!timestamp) return ''
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
}

const getStatusClass = (estado: string) => {
  if (estado === 'normal') return 'status-normal'
  if (estado === 'advertencia') return 'status-warning'
  return 'status-critical'
}

const getMetricClass = (value: number) => {
  if (value >= 90) return 'metric-excellent'
  if (value >= 80) return 'metric-good'
  if (value >= 70) return 'metric-warning'
  return 'metric-critical'
}

const getUptimeBadgeClass = (uptime: number) => {
  if (uptime >= 99) return 'badge-excellent'
  if (uptime >= 95) return 'badge-good'
  if (uptime >= 90) return 'badge-warning'
  return 'badge-critical'
}

const getErrorRateClass = (rate: number) => {
  if (rate <= 1) return 'success'
  if (rate <= 3) return 'warning'
  return 'error'
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
      flex-wrap wrap

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
          display none

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

.system-status
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  .status-header
    display flex
    justify-content space-between
    align-items center
    margin-bottom 20px

    @media (max-width: 768px)
      flex-direction column
      align-items flex-start
      gap 10px

    h2
      margin 0
      font-size 20px
      color #333
      font-weight 600

    .auto-refresh
      display flex
      align-items center
      gap 8px
      font-size 13px
      color #666

      .refresh-indicator
        width 8px
        height 8px
        background #ccc
        border-radius 50%
        transition all 0.3s ease

        &.active
          background #2ecc71
          box-shadow 0 0 8px rgba(46, 204, 113, 0.5)

      .refresh-text
        font-size 12px

  .status-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(220px, 1fr))
    gap 16px

    @media (max-width: 768px)
      grid-template-columns 1fr
      gap 12px

    .status-card
      background #f8f9fa
      border-radius 10px
      padding 20px
      display flex
      align-items center
      gap 16px
      transition all 0.3s ease

      &:hover
        transform translateY(-2px)
        box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)

      &.status-normal
        border-left 4px solid #2ecc71

      &.status-warning
        border-left 4px solid #f39c12

      &.status-critical
        border-left 4px solid #e74c3c

      .status-icon
        font-size 32px
        line-height 1

      .status-info
        flex 1

        h3
          margin 0 0 4px 0
          font-size 24px
          color #333
          font-weight 700

        p
          margin 0
          font-size 13px
          color #666

.totems-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

  .totems-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(300px, 1fr))
    gap 16px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .totem-card
      background #f8f9fa
      border-radius 10px
      padding 16px
      transition all 0.3s ease

      &:hover
        box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)

      .totem-header
        display flex
        justify-content space-between
        align-items center
        margin-bottom 12px
        padding-bottom 12px
        border-bottom 2px solid #e0e0e0

        h4
          margin 0
          font-size 16px
          color #333
          font-weight 600

        .totem-status
          font-size 20px
          line-height 1

      .totem-stats
        .totem-stat
          display flex
          justify-content space-between
          align-items center
          margin-bottom 8px
          font-size 13px

          &:last-child
            margin-bottom 0

          .label
            color #666

          .value
            color #333
            font-weight 600

.alerts-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

  .alerts-container
    display flex
    flex-direction column
    gap 12px

    .alert-card
      display flex
      gap 12px
      padding 16px
      border-radius 8px
      border-left 4px solid
      transition all 0.3s ease

      &:hover
        transform translateX(4px)
        box-shadow 0 2px 8px rgba(0, 0, 0, 0.1)

      &.critico
        background #fee
        border-color #e74c3c

      &.advertencia
        background #fef5e7
        border-color #f39c12

      &.info
        background #e8f4f8
        border-color #3498db

      .alert-icon
        font-size 24px
        line-height 1

      .alert-content
        flex 1

        h4
          margin 0 0 4px 0
          font-size 14px
          color #333
          font-weight 600

        p
          margin 0 0 8px 0
          font-size 13px
          color #555
          line-height 1.4

        .alert-time
          font-size 11px
          color #999

.today-metrics
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

  .metrics-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(240px, 1fr))
    gap 16px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .metric-card
      background #f8f9fa
      border-radius 10px
      padding 20px
      text-align center
      transition all 0.3s ease

      &:hover
        transform translateY(-2px)
        box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)

      .metric-label
        font-size 13px
        color #666
        margin-bottom 8px

      .metric-value
        font-size 32px
        font-weight 700
        margin-bottom 8px

        &.metric-excellent
          color #2ecc71

        &.metric-good
          color #3498db

        &.metric-warning
          color #f39c12

        &.metric-critical
          color #e74c3c

      .metric-trend
        font-size 12px
        color #666

.totem-metrics-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  .section-header
    margin-bottom 24px

    h3
      margin 0 0 12px 0
      font-size 18px
      color #333
      font-weight 600

    .metrics-summary
      display flex
      gap 24px
      flex-wrap wrap

      @media (max-width: 768px)
        flex-direction column
        gap 8px

      .summary-item
        font-size 13px
        color #666

        strong
          color #333
          margin-right 4px

  .totem-metrics-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(320px, 1fr))
    gap 20px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .totem-metric-card
      background #f8f9fa
      border-radius 12px
      overflow hidden
      border 1px solid #e0e0e0
      transition all 0.3s ease

      &:hover
        transform translateY(-4px)
        box-shadow 0 6px 20px rgba(0, 0, 0, 0.1)

      .metric-card-header
        background linear-gradient(135deg, #e30613, #c50510)
        padding 16px
        display flex
        justify-content space-between
        align-items center

        h4
          margin 0
          font-size 16px
          color white
          font-weight 700

        .metric-badge
          padding 4px 12px
          border-radius 12px
          font-size 11px
          font-weight 700
          text-transform uppercase
          letter-spacing 0.5px
          background white
          color #333
          border 1px solid rgba(255, 255, 255, 0.3)

      .metric-card-body
        padding 16px

        .metric-row
          display flex
          gap 12px
          margin-bottom 12px

          &:last-child
            margin-bottom 0

          .metric-item
            flex 1
            display flex
            align-items center
            gap 10px
            background white
            padding 12px
            border-radius 8px
            border 1px solid #e0e0e0

            &.full-width
              flex-basis 100%

            .metric-icon
              display flex
              align-items center
              justify-content center
              width 20px
              height 20px
              flex-shrink 0

              img
                width 20px
                height 20px
                object-fit contain

            .metric-details
              flex 1
              display flex
              flex-direction column
              gap 4px

              .metric-label
                font-size 11px
                color #666
                text-transform uppercase
                letter-spacing 0.5px

              .metric-value
                font-size 16px
                color #333
                font-weight 700

                &.success
                  color #2ecc71

                &.warning
                  color #f39c12

                &.error
                  color #e74c3c

      .metric-card-footer
        padding 12px 16px
        background white
        border-top 1px solid #e0e0e0
        display flex
        justify-content space-between
        align-items center

        .cac-label
          font-size 12px
          color #666
          font-weight 500

        .status-label
          padding 4px 10px
          border-radius 10px
          font-size 11px
          font-weight 600
          text-transform uppercase

          &.activo
            background #2ecc7120
            color #2ecc71

          &.inactivo
            background #e74c3c20
            color #e74c3c

          &.mantenimiento
            background #f39c1220
            color #f39c12
</style>

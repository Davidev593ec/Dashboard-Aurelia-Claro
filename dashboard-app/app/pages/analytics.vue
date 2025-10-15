<template>
  <div class="dashboard">
    <Sidebar />
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard Aurelia - Analytics y Horarios Pico</h1>
        <div class="header-actions">
          <span class="user-info">{{ user?.name || user?.email }}</span>
          <button @click="downloadExcel" class="btn-download">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar Excel
          </button>
          <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    </header>

    <div class="dashboard-content">
      <div class="filter-container">
        <div class="date-filters">
          <div class="date-input-group">
            <label for="fecha-desde">Desde:</label>
            <input
              id="fecha-desde"
              type="date"
              v-model="fechaDesde"
              @change="fetchData"
              class="date-input"
            />
          </div>
          <div class="date-input-group">
            <label for="fecha-hasta">Hasta:</label>
            <input
              id="fecha-hasta"
              type="date"
              v-model="fechaHasta"
              @change="fetchData"
              class="date-input"
            />
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando análisis de horarios pico...</p>
      </div>

      <template v-else>
        <!-- Resumen de Horarios Pico -->
        <section class="summary-section">
          <h2>Resumen de Análisis</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon">
                <img src="~/assets/icons/calendar-clock.svg" alt="Calendario" style="width: 32px; height: 32px;" />
              </div>
              <div class="summary-info">
                <h3>{{ data.totalHorarios || 0 }}</h3>
                <p>Horarios Analizados</p>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">
                <img src="~/assets/icons/fire.svg" alt="Pico" style="width: 32px; height: 32px;" />
              </div>
              <div class="summary-info">
                <h3>{{ data.topHorarios?.length || 0 }}</h3>
                <p>Horarios Pico Identificados</p>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">
                <img src="~/assets/icons/clock.svg" alt="Tiempo" style="width: 32px; height: 32px;" />
              </div>
              <div class="summary-info">
                <h3>{{ data.horasMasConcurridas?.join(', ') || '-' }}</h3>
                <p>Horas Más Concurridas</p>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">
                <img src="~/assets/icons/chart.svg" alt="Gráfico" style="width: 32px; height: 32px;" />
              </div>
              <div class="summary-info">
                <h3>{{ data.promedioTurnosPorHora?.toFixed(1) || 0 }}</h3>
                <p>Promedio Turnos/Hora</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Top 10 Horarios Pico -->
        <section class="top-horarios-section">
          <h3>Top 10 Horarios con Mayor Demanda</h3>
          <div class="table-container">
            <table class="horarios-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Total Turnos</th>
                  <th>Atendidos</th>
                  <th>Abandonados</th>
                  <th>Tasa Abandono</th>
                  <th>Tiempo Espera</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(horario, index) in data.topHorarios" :key="index">
                  <td>
                    <span class="rank-badge" :class="getRankClass(index + 1)">
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td>{{ formatDate(horario.fecha) }}</td>
                  <td>
                    <span class="hora-badge">{{ formatHora(horario.hora) }}</span>
                  </td>
                  <td class="text-bold">{{ horario.totalTurnos }}</td>
                  <td class="text-success">{{ horario.turnosAtendidos }}</td>
                  <td class="text-danger">{{ horario.turnosAbandonados }}</td>
                  <td>
                    <span class="badge-abandono" :class="getAbandonoClass(horario.tasaAbandono)">
                      {{ horario.tasaAbandono?.toFixed(1) }}%
                    </span>
                  </td>
                  <td>{{ formatTime(horario.tiempoEsperaPromedio) }}</td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(horario.tasaAbandono)">
                      {{ getStatusText(horario.tasaAbandono) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Heatmap de Actividad -->
        <section class="heatmap-section">
          <h3>Mapa de Calor - Actividad por Hora y Día</h3>
          <div class="heatmap-container">
            <div class="heatmap-grid">
              <div class="heatmap-row header-row">
                <div class="cell header">Hora</div>
                <div class="cell header" v-for="dia in diasSemana" :key="dia">{{ dia }}</div>
              </div>
              <div class="heatmap-row" v-for="hora in horas" :key="hora">
                <div class="cell hour-label">{{ hora }}:00</div>
                <div
                  class="cell data-cell"
                  v-for="dia in diasSemana"
                  :key="`${hora}-${dia}`"
                  :style="getHeatmapStyle(getHeatmapValue(hora, dia))"
                  :title="`${dia} ${hora}:00 - ${getHeatmapValue(hora, dia)} turnos`"
                >
                  {{ getHeatmapValue(hora, dia) || '' }}
                </div>
              </div>
            </div>
            <div class="heatmap-legend">
              <span>Baja actividad</span>
              <div class="legend-gradient"></div>
              <span>Alta actividad</span>
            </div>
          </div>
        </section>

        <!-- Recomendaciones -->
        <section class="recommendations-section" v-if="data.recomendaciones && data.recomendaciones.length > 0">
          <h3>Recomendaciones de Optimización</h3>
          <div class="recommendations-grid">
            <div v-for="(rec, index) in data.recomendaciones" :key="index"
                 class="recommendation-card"
                 :class="rec.prioridad">
              <div class="rec-header">
                <span class="rec-icon">
                  <img v-if="rec.prioridad === 'alta'" src="~/assets/icons/alert-high.svg" alt="Alta" style="width: 18px; height: 18px;" />
                  <img v-else-if="rec.prioridad === 'media'" src="~/assets/icons/alert-medium.svg" alt="Media" style="width: 18px; height: 18px;" />
                  <img v-else src="~/assets/icons/alert-low.svg" alt="Baja" style="width: 18px; height: 18px;" />
                </span>
                <span class="rec-priority">{{ rec.prioridad?.toUpperCase() }}</span>
              </div>
              <h4>{{ rec.titulo }}</h4>
              <p>{{ rec.descripcion }}</p>
              <div class="rec-action" v-if="rec.accion">
                <strong>Acción sugerida:</strong> {{ rec.accion }}
              </div>
            </div>
          </div>
        </section>

        <!-- Gráfica de Tendencias por Hora -->
        <section class="chart-section">
          <h3>Tendencias de Demanda por Hora del Día</h3>
          <div class="chart-card">
            <BarChart
              :data="{
                labels: tendenciasPorHora.labels,
                values: tendenciasPorHora.values
              }"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'

const { user, logout, isAuthenticated, token } = useAuth()

const loading = ref(true)
const fechaDesde = ref('')
const fechaHasta = ref('')
const data = ref<any>({
  totalHorarios: 0,
  topHorarios: [],
  horasMasConcurridas: [],
  promedioTurnosPorHora: 0,
  recomendaciones: [],
  heatmapData: []
})

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const horas = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00 - 22:00

const tendenciasPorHora = ref({ labels: [], values: [] })

onMounted(async () => {
  await nextTick()

  if (!isAuthenticated.value) {
    navigateTo('/login')
    return
  }

  await fetchData()
})

const fetchData = async () => {
  try {
    loading.value = true

    // Construir parámetros de filtro
    const params: any = {}
    if (fechaDesde.value) params.fechaInicio = fechaDesde.value
    if (fechaHasta.value) params.fechaFin = fechaHasta.value

    // Obtener datos de horarios pico
    const horariosData = await $fetch('/api/analytics/horarios-pico', {
      headers: {
        authorization: `Bearer ${token.value}`
      },
      params
    })

    data.value = horariosData

    // Procesar tendencias por hora del día
    const turnosPorHora: Record<number, number> = {}

    if (horariosData.heatmapData && horariosData.heatmapData.length > 0) {
      horariosData.heatmapData.forEach((item: any) => {
        const hora = item.hora
        turnosPorHora[hora] = (turnosPorHora[hora] || 0) + item.turnos
      })
    }

    // Generar labels y values para el gráfico
    const sortedHoras = Object.keys(turnosPorHora)
      .map(Number)
      .sort((a, b) => a - b)

    tendenciasPorHora.value = {
      labels: sortedHoras.map(h => `${h}:00`),
      values: sortedHoras.map(h => turnosPorHora[h])
    }

  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short'
  })
}

const formatHora = (hora: number) => {
  return `${hora.toString().padStart(2, '0')}:00`
}

const formatTime = (seconds: number) => {
  if (!seconds) return '0s'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
}

const getRankClass = (rank: number) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-default'
}

const getAbandonoClass = (tasa: number) => {
  if (!tasa) return 'abandono-low'
  if (tasa <= 5) return 'abandono-low'
  if (tasa <= 10) return 'abandono-medium'
  return 'abandono-high'
}

const getStatusClass = (tasa: number) => {
  if (!tasa || tasa <= 5) return 'status-excellent'
  if (tasa <= 10) return 'status-good'
  if (tasa <= 20) return 'status-warning'
  return 'status-critical'
}

const getStatusText = (tasa: number) => {
  if (!tasa || tasa <= 5) return 'Excelente'
  if (tasa <= 10) return 'Bueno'
  if (tasa <= 20) return 'Regular'
  return 'Crítico'
}

const getHeatmapValue = (hora: number, dia: string): number => {
  if (!data.value.heatmapData) return 0

  const diaIndex = diasSemana.indexOf(dia)
  const item = data.value.heatmapData.find((h: any) => {
    const date = new Date(h.fecha)
    const dayOfWeek = date.getDay()
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    return h.hora === hora && adjustedDay === diaIndex
  })

  return item?.turnos || 0
}

const getHeatmapStyle = (value: number) => {
  if (!value || value === 0) {
    return {
      backgroundColor: '#f8f9fa',
      color: '#999'
    }
  }

  const maxValue = Math.max(
    ...data.value.heatmapData?.map((h: any) => h.turnos) || [1]
  )

  const intensity = value / maxValue
  const r = 227
  const g = Math.floor(6 + (255 - 6) * (1 - intensity))
  const b = Math.floor(19 + (255 - 19) * (1 - intensity))

  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: intensity > 0.5 ? 'white' : '#333',
    fontWeight: intensity > 0.3 ? '600' : '400'
  }
}

const handleLogout = () => {
  logout()
}

const downloadExcel = async () => {
  try {
    const excelData = data.value.topHorarios.map((horario: any, index: number) => ({
      'Ranking': index + 1,
      'Fecha': formatDate(horario.fecha),
      'Hora': formatHora(horario.hora),
      'Total Turnos': horario.totalTurnos,
      'Atendidos': horario.turnosAtendidos,
      'Abandonados': horario.turnosAbandonados,
      'Tasa Abandono (%)': horario.tasaAbandono?.toFixed(2),
      'Tiempo Espera': formatTime(horario.tiempoEsperaPromedio),
      'Estado': getStatusText(horario.tasaAbandono)
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const colWidths = [
      { wch: 8 },   // Ranking
      { wch: 12 },  // Fecha
      { wch: 8 },   // Hora
      { wch: 12 },  // Total Turnos
      { wch: 10 },  // Atendidos
      { wch: 12 },  // Abandonados
      { wch: 16 },  // Tasa Abandono
      { wch: 14 },  // Tiempo Espera
      { wch: 12 }   // Estado
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Horarios Pico')

    const fecha = new Date().toISOString().split('T')[0]
    const fileName = `horarios_pico_claro_${fecha}.xlsx`

    XLSX.writeFile(wb, fileName)

    console.log('✅ Excel descargado exitosamente')
  } catch (error) {
    console.error('❌ Error al descargar Excel:', error)
    alert('Error al generar el archivo Excel')
  }
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

      .user-info
        color white
        font-size 14px
        font-weight 500

        @media (max-width: 768px)
          font-size 12px
          display none

      .btn-download
        padding 10px 24px
        background white
        color #e30613
        border none
        border-radius 50px
        cursor pointer
        font-size 14px
        font-weight 700
        transition all 0.3s ease
        box-shadow 0 2px 8px rgba(0, 0, 0, 0.15)

        @media (max-width: 768px)
          font-size 12px
          padding 8px 16px

        &:hover
          background #f5f5f5
          transform translateY(-2px)
          box-shadow 0 4px 12px rgba(0, 0, 0, 0.2)

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

.filter-container
  display flex
  justify-content flex-end
  align-items center
  margin-bottom 24px

  @media (max-width: 768px)
    margin-bottom 20px

  .date-filters
    display flex
    gap 12px
    align-items center

    @media (max-width: 768px)
      flex-direction column
      gap 8px
      width 100%

    .date-input-group
      display flex
      align-items center
      gap 8px

      @media (max-width: 768px)
        width 100%

      label
        font-size 14px
        font-weight 600
        color #333
        white-space nowrap

        @media (max-width: 768px)
          font-size 12px

      .date-input
        padding 10px 16px
        background white
        color #333
        border 1px solid #e0e0e0
        border-radius 8px
        font-size 14px
        font-weight 500
        transition all 0.3s ease
        outline none
        box-shadow 0 2px 4px rgba(0, 0, 0, 0.08)
        cursor pointer

        @media (max-width: 768px)
          font-size 12px
          padding 8px 12px
          flex 1

        &:hover
          background-color #f8f9fa
          border-color #e30613
          box-shadow 0 2px 8px rgba(227, 6, 19, 0.15)

        &:focus
          border-color #e30613
          box-shadow 0 0 0 3px rgba(227, 6, 19, 0.1)

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

.summary-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  h2
    margin 0 0 20px 0
    font-size 20px
    color #333
    font-weight 600

  .summary-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(240px, 1fr))
    gap 16px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .summary-card
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

      .summary-icon
        font-size 32px
        line-height 1

      .summary-info
        flex 1

        h3
          margin 0 0 4px 0
          font-size 22px
          color #333
          font-weight 700

        p
          margin 0
          font-size 13px
          color #666

.top-horarios-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

.table-container
  overflow-x auto

.horarios-table
  width 100%
  border-collapse collapse

  thead
    background #f8f9fa

    th
      padding 12px
      text-align left
      font-size 13px
      font-weight 600
      color #666
      border-bottom 2px solid #e0e0e0
      white-space nowrap

  tbody
    tr
      border-bottom 1px solid #f0f0f0
      transition background 0.2s ease

      &:hover
        background #f8f9fa

    td
      padding 12px
      font-size 13px
      color #333

      &.text-bold
        font-weight 600

      &.text-success
        color #2ecc71

      &.text-danger
        color #e74c3c

.rank-badge
  display inline-block
  width 28px
  height 28px
  border-radius 50%
  text-align center
  line-height 28px
  font-weight 700
  font-size 12px
  color white

  &.rank-gold
    background linear-gradient(135deg, #ffd700, #ffed4e)
    color #333

  &.rank-silver
    background linear-gradient(135deg, #c0c0c0, #e8e8e8)
    color #333

  &.rank-bronze
    background linear-gradient(135deg, #cd7f32, #e09a5f)
    color white

  &.rank-default
    background #95a5a6
    color white

.hora-badge
  display inline-block
  padding 4px 10px
  background #e3061315
  color #e30613
  border-radius 6px
  font-weight 600
  font-size 12px

.badge-abandono
  display inline-block
  padding 4px 10px
  border-radius 6px
  font-size 12px
  font-weight 600

  &.abandono-low
    background #2ecc7120
    color #2ecc71

  &.abandono-medium
    background #f39c1220
    color #f39c12

  &.abandono-high
    background #e74c3c20
    color #e74c3c

.status-badge
  display inline-block
  padding 4px 10px
  border-radius 6px
  font-size 11px
  font-weight 600

  &.status-excellent
    background #2ecc7120
    color #2ecc71

  &.status-good
    background #3498db20
    color #3498db

  &.status-warning
    background #f39c1220
    color #f39c12

  &.status-critical
    background #e74c3c20
    color #e74c3c

.heatmap-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

  .heatmap-container
    overflow-x auto

    .heatmap-grid
      display inline-block
      min-width 100%

      .heatmap-row
        display flex
        gap 2px
        margin-bottom 2px

        &.header-row
          margin-bottom 8px

        .cell
          min-width 60px
          height 40px
          display flex
          align-items center
          justify-content center
          font-size 12px
          border-radius 4px
          transition all 0.3s ease

          &.header
            font-weight 600
            color #666
            background transparent

          &.hour-label
            font-weight 600
            color #666
            background transparent
            min-width 50px

          &.data-cell
            cursor pointer
            font-weight 500

            &:hover
              transform scale(1.05)
              box-shadow 0 2px 8px rgba(0, 0, 0, 0.15)
              z-index 1

    .heatmap-legend
      display flex
      align-items center
      gap 12px
      margin-top 20px
      font-size 12px
      color #666

      .legend-gradient
        width 200px
        height 20px
        background linear-gradient(to right, #f8f9fa, #e30613)
        border-radius 4px

.recommendations-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

  .recommendations-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(300px, 1fr))
    gap 16px

    @media (max-width: 768px)
      grid-template-columns 1fr

    .recommendation-card
      background #f8f9fa
      border-radius 10px
      padding 20px
      border-left 4px solid
      transition all 0.3s ease

      &:hover
        transform translateY(-2px)
        box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)

      &.alta
        border-color #e74c3c

      &.media
        border-color #f39c12

      &.baja
        border-color #2ecc71

      .rec-header
        display flex
        align-items center
        gap 8px
        margin-bottom 12px

        .rec-icon
          font-size 18px
          line-height 1

        .rec-priority
          font-size 11px
          font-weight 700
          padding 3px 8px
          border-radius 10px
          background rgba(0, 0, 0, 0.1)

      h4
        margin 0 0 8px 0
        font-size 16px
        color #333
        font-weight 600

      p
        margin 0 0 12px 0
        font-size 13px
        color #555
        line-height 1.5

      .rec-action
        font-size 12px
        color #666
        padding 10px
        background white
        border-radius 6px

        strong
          color #333

.chart-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

  .chart-card
    min-height 300px
</style>

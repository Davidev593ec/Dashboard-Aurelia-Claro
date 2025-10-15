<template>
  <div class="dashboard">
    <Sidebar />
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard Aurelia - Encuestas</h1>
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
        <p>Cargando datos...</p>
      </div>

      <template v-else>
        <!-- KPIs -->
        <section class="stats-grid">
          <StatCard
            :value="stats.totalEncuestas"
            label="Total de Encuestas"
            color="#e30613"
          >
            <template #icon>
              <img src="~/assets/icons/survey.svg" alt="Survey" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>

          <StatCard
            :value="`${stats.promedioNPS.toFixed(1)}/10`"
            label="Promedio NPS"
            color="#c50510"
          >
            <template #icon>
              <img src="~/assets/icons/star.svg" alt="Star" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>

          <StatCard
            :value="stats.npsScore"
            label="NPS Score"
            color="#333333"
          >
            <template #icon>
              <img src="~/assets/icons/score.svg" alt="Score" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>

          <StatCard
            :value="`${stats.promotores}`"
            label="Promotores (9-10)"
            color="#2ecc71"
          >
            <template #icon>
              <img src="~/assets/icons/thum.svg" alt="Thumb up" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>
        </section>

        <!-- Gráficas -->
        <section class="charts-grid-top">
          <div class="chart-card">
            <h3>Experiencia con el Servicio</h3>
            <PieChart
              :data="{
                labels: calificacionChartData.labels,
                values: calificacionChartData.values,
                colors: calificacionChartData.colors
              }"
              unit="encuestas"
            />
          </div>

          <div class="chart-card">
            <h3>Recomendacion del Servicio</h3>
            <BarChart
              :data="{
                labels: npsChartData.labels,
                values: npsChartData.values
              }"
            />
          </div>
        </section>

        <section class="charts-grid-top">
          <div class="chart-card">
            <h3>Rango de Edad</h3>
            <BarChart
              :data="{
                labels: edadChartData.labels,
                values: edadChartData.values
              }"
            />
          </div>

          <div class="chart-card">
            <h3>Mejoras Sugeridas (Top General)</h3>
            <div class="mejoras-container">
              <div v-for="(mejora, index) in topMejorasGeneral" :key="index" class="mejora-item">
                <span class="mejora-rank">{{ index + 1 }}</span>
                <span class="mejora-text">{{ mejora.texto }}</span>
                <span class="mejora-badge">{{ mejora.count }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Mejoras Categorizadas -->
        <section class="mejoras-categorizadas-section">
          <h3>Mejoras Sugeridas por Categoría</h3>
          <div class="categorias-grid">
            <div class="categoria-card" v-if="mejorasPorCategoria.sistema?.length > 0">
              <div class="categoria-header">
                <span class="categoria-icon">
                  <img src="~/assets/icons/computer.svg" alt="Sistema" style="width: 24px; height: 24px;" />
                </span>
                <h4>Sistema</h4>
              </div>
              <div class="mejoras-container">
                <div v-for="(mejora, index) in mejorasPorCategoria.sistema.slice(0, 5)" :key="index" class="mejora-item-small">
                  <span class="mejora-text">{{ mejora.texto }}</span>
                  <span class="mejora-badge">{{ mejora.count }}</span>
                </div>
              </div>
            </div>

            <div class="categoria-card" v-if="mejorasPorCategoria.infraestructura?.length > 0">
              <div class="categoria-header">
                <span class="categoria-icon">
                  <img src="~/assets/icons/infrastructure.svg" alt="Infraestructura" style="width: 24px; height: 24px;" />
                </span>
                <h4>Infraestructura</h4>
              </div>
              <div class="mejoras-container">
                <div v-for="(mejora, index) in mejorasPorCategoria.infraestructura.slice(0, 5)" :key="index" class="mejora-item-small">
                  <span class="mejora-text">{{ mejora.texto }}</span>
                  <span class="mejora-badge">{{ mejora.count }}</span>
                </div>
              </div>
            </div>

            <div class="categoria-card" v-if="mejorasPorCategoria.accesibilidad?.length > 0">
              <div class="categoria-header">
                <span class="categoria-icon">
                  <img src="~/assets/icons/accessibility.svg" alt="Accesibilidad" style="width: 24px; height: 24px;" />
                </span>
                <h4>Accesibilidad</h4>
              </div>
              <div class="mejoras-container">
                <div v-for="(mejora, index) in mejorasPorCategoria.accesibilidad.slice(0, 5)" :key="index" class="mejora-item-small">
                  <span class="mejora-text">{{ mejora.texto }}</span>
                  <span class="mejora-badge">{{ mejora.count }}</span>
                </div>
              </div>
            </div>

            <div class="categoria-card" v-if="mejorasPorCategoria.expansion?.length > 0">
              <div class="categoria-header">
                <span class="categoria-icon">
                  <img src="~/assets/icons/location.svg" alt="Expansión" style="width: 24px; height: 24px;" />
                </span>
                <h4>Expansión</h4>
              </div>
              <div class="mejoras-container">
                <div v-for="(mejora, index) in mejorasPorCategoria.expansion.slice(0, 5)" :key="index" class="mejora-item-small">
                  <span class="mejora-text">{{ mejora.texto }}</span>
                  <span class="mejora-badge">{{ mejora.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tabla de últimas encuestas -->
        <section class="table-section">
          <h3>Últimas Encuestas Registradas</h3>
          <div class="table-container">
            <table class="encuestas-table">
              <thead>
                <tr>
                  <th>NPS</th>
                  <th>Calificación</th>
                  <th>Comentario</th>
                  <th>Rango de Edad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="encuesta in lastEncuestas" :key="encuesta.id">
                  <td>
                    <span class="badge" :class="getNPSClass(encuesta.nps)">
                      {{ encuesta.nps }}
                    </span>
                  </td>
                  <td>{{ encuesta.calificacion }}</td>
                  <td>{{ encuesta.comentario || '-' }}</td>
                  <td>{{ encuesta.rangoEdad || '-' }}</td>
                </tr>
              </tbody>
            </table>
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
const stats = ref<any>({
  totalEncuestas: 0,
  promedioNPS: 0,
  npsScore: 0,
  detractores: 0,
  pasivos: 0,
  promotores: 0
})
const calificacionChartData = ref({ labels: [], values: [], colors: [] })
const npsChartData = ref({ labels: [], values: [] })
const edadChartData = ref({ labels: [], values: [] })
const topMejorasGeneral = ref<any[]>([])
const mejorasPorCategoria = ref<any>({
  sistema: [],
  infraestructura: [],
  accesibilidad: [],
  expansion: [],
  otros: []
})
const lastEncuestas = ref<any[]>([])

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

    // Obtener estadísticas
    const statsData = await $fetch('/api/encuestas/stats', {
      headers: {
        authorization: `Bearer ${token.value}`
      },
      params
    })

    stats.value = statsData

    // Procesar distribución por calificación
    if (statsData.distribuccionCalificacion && statsData.distribuccionCalificacion.length > 0) {
      const colorMap: Record<string, string> = {
        'excelente': '#2ecc71',
        'buena': '#3498db',
        'regular': '#f39c12',
        'mala': '#e74c3c',
        'muy mala': '#c0392b'
      }

      calificacionChartData.value = {
        labels: statsData.distribuccionCalificacion.map((item: any) =>
          item.calificacion.charAt(0).toUpperCase() + item.calificacion.slice(1)
        ),
        values: statsData.distribuccionCalificacion.map((item: any) => Number(item.count)),
        colors: statsData.distribuccionCalificacion.map((item: any) =>
          colorMap[item.calificacion.toLowerCase()] || '#95a5a6'
        )
      }
    }

    // Procesar distribución NPS
    if (statsData.distribuccionNPS && statsData.distribuccionNPS.length > 0) {
      npsChartData.value = {
        labels: statsData.distribuccionNPS.map((item: any) => item.nps.toString()),
        values: statsData.distribuccionNPS.map((item: any) => Number(item.count))
      }
    }

    // Procesar distribución por edad
    if (statsData.distribuccionEdad && statsData.distribuccionEdad.length > 0) {
      edadChartData.value = {
        labels: statsData.distribuccionEdad.map((item: any) => item.rangoEdad),
        values: statsData.distribuccionEdad.map((item: any) => Number(item.count))
      }
    }

    // Procesar mejoras categorizadas desde la API
    if (statsData.mejorasPorCategoria) {
      mejorasPorCategoria.value = statsData.mejorasPorCategoria
    }

    // Obtener todas las encuestas para procesar top mejoras general
    const allEncuestas = await $fetch('/api/encuestas?limit=10000', {
      headers: {
        authorization: `Bearer ${token.value}`
      },
      params
    })

    // Procesar comentarios/mejoras para top general
    const mejorasMap: Record<string, number> = {}
    allEncuestas.data.forEach((encuesta: any) => {
      if (encuesta.comentario && encuesta.comentario.trim() && encuesta.comentario !== '-') {
        const comentario = encuesta.comentario.trim()
        mejorasMap[comentario] = (mejorasMap[comentario] || 0) + 1
      }
    })

    // Obtener top 5 mejoras para el listado general
    topMejorasGeneral.value = Object.entries(mejorasMap)
      .map(([texto, count]) => ({ texto, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Obtener últimas encuestas
    const encuestasData = await $fetch('/api/encuestas?limit=5', {
      headers: {
        authorization: `Bearer ${token.value}`
      },
      params
    })

    lastEncuestas.value = encuestasData.data

  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const getNPSClass = (nps: number) => {
  if (nps >= 9) return 'nps-promotor'
  if (nps >= 7) return 'nps-pasivo'
  return 'nps-detractor'
}

const handleLogout = () => {
  logout()
}

const downloadExcel = async () => {
  try {
    const allEncuestasData = await $fetch('/api/encuestas?limit=10000', {
      headers: {
        authorization: `Bearer ${token.value}`
      }
    })

    const excelData = allEncuestasData.data.map((encuesta: any) => ({
      'NPS': encuesta.nps,
      'Calificación': encuesta.calificacion,
      'Comentario': encuesta.comentario || '-',
      'Rango de Edad': encuesta.rangoEdad || '-'
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const colWidths = [
      { wch: 6 },   // NPS
      { wch: 15 },  // Calificación
      { wch: 50 },  // Comentario
      { wch: 35 }   // Rango de Edad
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Encuestas')

    const fecha = new Date().toISOString().split('T')[0]
    const fileName = `encuestas_claro_${fecha}.xlsx`

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
    border-top-color #667eea
    border-radius 50%
    animation spin 1s linear infinite
    margin 0 auto 20px

  p
    color #666

@keyframes spin
  to
    transform rotate(360deg)

.stats-grid
  display grid
  grid-template-columns repeat(auto-fit, minmax(250px, 1fr))
  gap 24px
  margin-bottom 40px

  @media (max-width: 768px)
    grid-template-columns 1fr
    gap 16px
    margin-bottom 24px

.charts-grid-top
  display grid
  grid-template-columns 1fr 1fr
  gap 24px
  margin-bottom 24px
  width 100%
  max-width 100%

  @media (max-width: 1024px)
    grid-template-columns 1fr
    gap 16px

  .chart-card
    background white
    border-radius 12px
    padding 24px
    box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
    min-width 0
    overflow hidden

    @media (max-width: 768px)
      padding 16px

    h3
      margin 0 0 20px 0
      font-size 18px
      color #333

      @media (max-width: 768px)
        font-size 16px
        margin 0 0 16px 0

.charts-grid-bottom
  display grid
  grid-template-columns 1fr
  gap 24px
  margin-bottom 40px
  width 100%
  max-width 100%

  @media (max-width: 768px)
    gap 16px
    margin-bottom 24px

  .chart-card
    background white
    border-radius 12px
    padding 24px
    box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
    min-width 0
    overflow hidden

    @media (max-width: 768px)
      padding 16px

    &.full-width
      grid-column 1 / -1

    h3
      margin 0 0 20px 0
      font-size 18px
      color #333

      @media (max-width: 768px)
        font-size 16px
        margin 0 0 16px 0

.table-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)

  @media (max-width: 768px)
    padding 16px

  h3
    margin 0 0 20px 0
    font-size 18px
    color #333

    @media (max-width: 768px)
      font-size 16px
      margin 0 0 16px 0

.table-container
  overflow-x auto

.encuestas-table
  width 100%
  border-collapse collapse

  thead
    background #f8f9fa

    th
      padding 12px
      text-align left
      font-size 14px
      font-weight 600
      color #666
      border-bottom 2px solid #e0e0e0

  tbody
    tr
      border-bottom 1px solid #f0f0f0
      transition background 0.2s ease

      &:hover
        background #f8f9fa

    td
      padding 12px
      font-size 14px
      color #333

.badge
  display inline-block
  padding 4px 12px
  border-radius 12px
  font-size 12px
  font-weight 600

  &.nps-promotor
    background #2ecc7120
    color #2ecc71

  &.nps-pasivo
    background #f39c1220
    color #f39c12

  &.nps-detractor
    background #e74c3c20
    color #e74c3c

.mejoras-container
  display flex
  flex-direction column
  gap 10px
  padding 10px 0

  .mejora-item
    display flex
    align-items center
    gap 10px
    padding 10px 12px
    background #f8f9fa
    border-radius 8px
    transition all 0.2s ease

    &:hover
      background #e9ecef

    .mejora-rank
      width 24px
      height 24px
      background #e30613
      color white
      border-radius 50%
      display flex
      align-items center
      justify-content center
      font-weight 700
      font-size 12px
      flex-shrink 0

    .mejora-text
      flex 1
      font-size 13px
      color #333
      line-height 1.3
      overflow hidden
      text-overflow ellipsis
      display -webkit-box
      -webkit-line-clamp 2
      -webkit-box-orient vertical

    .mejora-badge
      background #e3061320
      color #e30613
      padding 3px 10px
      border-radius 10px
      font-size 11px
      font-weight 600
      flex-shrink 0

.mejoras-categorizadas-section
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  margin-bottom 24px

  @media (max-width: 768px)
    padding 16px

  > h3
    margin 0 0 20px 0
    font-size 18px
    color #333

    @media (max-width: 768px)
      font-size 16px
      margin 0 0 16px 0

  .categorias-grid
    display grid
    grid-template-columns repeat(auto-fit, minmax(280px, 1fr))
    gap 16px

    @media (max-width: 768px)
      grid-template-columns 1fr
      gap 12px

    .categoria-card
      background #f8f9fa
      border-radius 10px
      padding 16px
      transition all 0.3s ease

      &:hover
        box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)
        transform translateY(-2px)

      .categoria-header
        display flex
        align-items center
        gap 10px
        margin-bottom 12px
        padding-bottom 12px
        border-bottom 2px solid #e0e0e0

        .categoria-icon
          font-size 24px
          line-height 1

        h4
          margin 0
          font-size 16px
          color #333
          font-weight 600

      .mejoras-container
        .mejora-item-small
          display flex
          align-items center
          justify-content space-between
          gap 8px
          padding 8px 10px
          background white
          border-radius 6px
          margin-bottom 6px
          transition all 0.2s ease

          &:last-child
            margin-bottom 0

          &:hover
            background #e9ecef

          .mejora-text
            flex 1
            font-size 12px
            color #555
            line-height 1.4
            overflow hidden
            text-overflow ellipsis
            display -webkit-box
            -webkit-line-clamp 2
            -webkit-box-orient vertical

          .mejora-badge
            background #e3061320
            color #e30613
            padding 2px 8px
            border-radius 8px
            font-size 10px
            font-weight 600
            flex-shrink 0
</style>

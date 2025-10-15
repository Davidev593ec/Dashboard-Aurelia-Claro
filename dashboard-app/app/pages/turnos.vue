<template>
  <div class="dashboard">
    <Sidebar />
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard Aurelia - Turnos</h1>
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
        <select v-model="selectedFilter" @change="fetchData" class="filter-select">
          <option value="">Todas las categorías</option>
          <option value="M">Móvil</option>
          <option value="E">Equipos</option>
          <option value="RR">Retención</option>
          <option value="V">Ventas</option>
          <option value="H">Hogar</option>
        </select>
      </div>
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
      </div>

      <template v-else>
        <!-- KPIs - Fila 1 -->
        <section class="stats-grid">
          <StatCard
            :value="stats.totalTurnos"
            label="Total de Turnos"
            color="#e30613"
          >
            <template #icon>
              <img src="~/assets/icons/ticket.svg" alt="Ticket" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>

          <StatCard
            :value="`${stats.tasaAtencion.toFixed(2)}%`"
            label="Tasa de Atención"
            color="#2ecc71"
          >
            <template #icon>
              <img src="~/assets/icons/thum.svg" alt="Aprobado" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>

          <StatCard
            :value="`${stats.tasaAbandono.toFixed(2)}%`"
            label="Tasa de Abandono"
            :color="stats.tasaAbandono > 10 ? '#e74c3c' : '#f39c12'"
          >
            <template #icon>
              <img src="~/assets/icons/cancel.svg" alt="Abandono" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>

          <StatCard
            :value="`${stats.promedioPorDia}`"
            label="Turnos por Día (Promedio)"
            color="#666666"
          >
            <template #icon>
              <img src="~/assets/icons/statics.svg" alt="Statistics" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>
        </section>

        <!-- Ciclo de Atención - Tiempos -->
        <section class="time-cycle-section">
          <div class="time-cycle-card">
            <div class="cycle-header">
              <div class="cycle-title">
                <img src="~/assets/icons/clock.svg" alt="Tiempos" style="width: 32px; height: 32px;" />
                <h3>Ciclo de Atención - Tiempos Promedio</h3>
              </div>
            </div>
            <div class="cycle-body">
              <div class="time-item">
                <div class="time-icon">
                  <img src="~/assets/icons/totem.svg" alt="Totem" style="width: 24px; height: 24px;" />
                </div>
                <div class="time-info">
                  <span class="time-label">Tiempo Uso Tótem</span>
                  <span class="time-value">{{ (stats.tiempoUsoTotem || 0).toFixed(2) }} seg</span>
                </div>
              </div>

              <div class="time-divider">→</div>

              <div class="time-item">
                <div class="time-icon">
                  <img src="~/assets/icons/user.svg" alt="Espera" style="width: 24px; height: 24px;" />
                </div>
                <div class="time-info">
                  <span class="time-label">Tiempo Espera</span>
                  <span class="time-value">{{ (stats.tiempoEsperaPromedio / 60).toFixed(2) }} min</span>
                </div>
              </div>

              <div class="time-divider">→</div>

              <div class="time-item">
                <div class="time-icon">
                  <img src="~/assets/icons/counter.svg" alt="Atención" style="width: 24px; height: 24px;" />
                </div>
                <div class="time-info">
                  <span class="time-label">Tiempo Atención</span>
                  <span class="time-value">{{ (stats.tiempoAtencionPromedio / 60).toFixed(2) }} min</span>
                </div>
              </div>

              <div class="time-divider">=</div>

              <div class="time-item time-total">
                <div class="time-icon">
                  <img src="~/assets/icons/clock.svg" alt="Total" style="width: 24px; height: 24px;" />
                </div>
                <div class="time-info">
                  <span class="time-label">Tiempo Total</span>
                  <span class="time-value total">{{ Math.round(stats.promedioTiempo / 60) }} min</span>
                </div>
              </div>
            </div>
          </div>

          <StatCard
            :value="stats.moduloMasOcupado?.modulo || '-'"
            label="Módulo Más Ocupado"
            color="#333333"
          >
            <template #icon>
              <img src="~/assets/icons/counter.svg" alt="Counter" style="width: 28px; height: 28px;" />
            </template>
          </StatCard>
        </section>

        <!-- Gráficas -->
        <section class="charts-grid-top">
          <div class="chart-card">
            <h3>Distribución por Tipo de Turno</h3>
            <PieChart
              :data="{
                labels: pieChartData.labels,
                values: pieChartData.values,
                colors: pieChartData.colors
              }"
              unit="turnos"
            />
          </div>

          <div class="chart-card">
            <h3>Turnos por Módulo</h3>
            <BarChart
              :data="{
                labels: barChartData.labels,
                values: barChartData.values
              }"
            />
          </div>

          <div class="chart-card">
            <h3>Estado de Turnos</h3>
            <DonutChart
              :data="{
                labels: donutChartData.labels,
                values: donutChartData.values,
                colors: donutChartData.colors
              }"
            />
          </div>
        </section>

        <section class="charts-grid-bottom">
          <div class="chart-card full-width">
            <h3>Evolución de Turnos por Día</h3>
            <LineChart
              :data="{
                labels: lineChartData.labels,
                values: lineChartData.values
              }"
            />
          </div>

          <div class="chart-card full-width">
            <h3>Evolución de Atendidos vs Abandonados</h3>
            <MultiLineChart
              :data="{
                labels: multiLineChartData.labels,
                datasets: multiLineChartData.datasets
              }"
            />
          </div>
        </section>

        <!-- Tabla de últimos turnos -->
        <section class="table-section">
          <h3>Últimos Turnos Registrados</h3>
          <div class="table-container">
            <table class="turnos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Número</th>
                  <th>Módulo</th>
                  <th>Tiempo</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="turno in lastTurnos" :key="turno.id">
                  <td>{{ formatDate(turno.fecha) }}</td>
                  <td>
                    <span class="badge" :class="`badge-${turno.letra}`">
                      {{ turno.letra }}
                    </span>
                  </td>
                  <td>{{ turno.numero }}</td>
                  <td>{{ turno.modulo }}</td>
                  <td>{{ turno.tiempo ? `${turno.tiempo} seg` : '-' }}</td>
                  <td>{{ turno.observacion || '-' }}</td>
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
const selectedFilter = ref('')
const fechaDesde = ref('')
const fechaHasta = ref('')

const stats = ref<any>({
  totalTurnos: 0,
  promedioTiempo: 0,
  moduloMasOcupado: null,
  turnosPorDia: 0,
  // Nuevas métricas
  tasaAtencion: 0,
  tasaAbandono: 0,
  tiempoEsperaPromedio: 0,
  tiempoAtencionPromedio: 0,
  tiempoUsoTotem: 0,
  promedioPorDia: 0
})

const pieChartData = ref({ labels: [], values: [], colors: [] })
const barChartData = ref({ labels: [], values: [] })
const lineChartData = ref({ labels: [], values: [] })
const donutChartData = ref({ labels: [], values: [], colors: [] })
const multiLineChartData = ref({ labels: [], datasets: [] })
const lastTurnos = ref<any[]>([])

onMounted(async () => {
  // Dar tiempo a que se cargue el auth desde localStorage
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
    if (selectedFilter.value) params.letra = selectedFilter.value
    if (fechaDesde.value) params.fechaInicio = fechaDesde.value
    if (fechaHasta.value) params.fechaFin = fechaHasta.value

    // Obtener estadísticas
    const statsData = await $fetch('/api/turnos/stats', {
      headers: {
        authorization: `Bearer ${token.value}`
      },
      params
    })

    stats.value.totalTurnos = statsData.totalTurnos
    stats.value.promedioTiempo = statsData.promedioTiempo || 0

    // Asignar nuevas métricas de la API
    stats.value.tasaAtencion = statsData.tasaAtencion || 0
    stats.value.tasaAbandono = statsData.tasaAbandono || 0
    stats.value.tiempoEsperaPromedio = statsData.promedioTiempoEspera || 0
    stats.value.tiempoAtencionPromedio = statsData.promedioTiempoAtencion || 0
    stats.value.tiempoUsoTotem = statsData.promedioTiempoUsoTotem || 0
    stats.value.promedioPorDia = statsData.promedioPorDia || 0

    console.log('📊 Stats recibidos:', statsData)

    // Procesar datos para gráfica de dona (Atendidos vs Abandonados)
    donutChartData.value = {
      labels: ['Atendidos', 'Abandonados'],
      values: [statsData.turnosAtendidos || 0, statsData.turnosAbandonados || 0],
      colors: ['#2ecc71', '#e74c3c']
    }

    // Procesar datos para gráfica de líneas múltiples (Evolución de atendidos y abandonados)
    if (statsData.estadoPorDia && statsData.estadoPorDia.length > 0) {
      multiLineChartData.value = {
        labels: statsData.estadoPorDia.map((item: any) => formatDate(item.fecha)),
        datasets: [
          {
            label: 'Atendidos',
            data: statsData.estadoPorDia.map((item: any) => item.atendidos),
            color: '#2ecc71'
          },
          {
            label: 'Abandonados',
            data: statsData.estadoPorDia.map((item: any) => item.abandonados),
            color: '#e74c3c'
          }
        ]
      }
      console.log('📈 Multi Line Chart Data:', multiLineChartData.value)
    }

    // Procesar distribución por letra (Pie Chart)
    if (statsData.distribuccionLetra && statsData.distribuccionLetra.length > 0) {
      const labelNames: Record<string, string> = {
        'M': 'Móvil',
        'E': 'Equipos',
        'RR': 'Retención',
        'V': 'Ventas',
        'H': 'Hogar'
      }

      const colorMap: Record<string, string> = {
        'Móvil': '#e30613',
        'Equipos': '#3498db',
        'Retención': '#2ecc71',
        'Ventas': '#f39c12',
        'Hogar': '#9b59b6'
      }

      const labels = statsData.distribuccionLetra.map((item: any) => labelNames[item.letra] || item.letra)

      pieChartData.value = {
        labels: labels,
        values: statsData.distribuccionLetra.map((item: any) => Number(item.count)),
        colors: labels.map((label: string) => colorMap[label] || '#e74c3c')
      }
      console.log('🥧 Pie Chart Data:', pieChartData.value)
    }

    // Procesar distribución por módulo (Bar Chart)
    if (statsData.distribuccionModulo && statsData.distribuccionModulo.length > 0) {
      const sortedModulos = statsData.distribuccionModulo
        .sort((a: any, b: any) => a.modulo - b.modulo)

      barChartData.value = {
        labels: sortedModulos.map((item: any) => `Módulo ${item.modulo}`),
        values: sortedModulos.map((item: any) => Number(item.count))
      }
      console.log('📊 Bar Chart Data:', barChartData.value)

      // Módulo más ocupado
      const maxModulo = statsData.distribuccionModulo
        .reduce((max: any, item: any) => Number(item.count) > Number(max.count) ? item : max)
      stats.value.moduloMasOcupado = maxModulo
    }

    // Procesar turnos por día (Line Chart)
    if (statsData.turnosPorDia && statsData.turnosPorDia.length > 0) {
      lineChartData.value = {
        labels: statsData.turnosPorDia.map((item: any) => formatDate(item.fecha)),
        values: statsData.turnosPorDia.map((item: any) => Number(item.count))
      }
      console.log('📈 Line Chart Data:', lineChartData.value)

      // Calcular promedio de turnos por día
      const total = statsData.turnosPorDia.reduce((sum: number, item: any) => sum + Number(item.count), 0)
      stats.value.turnosPorDia = total / statsData.turnosPorDia.length
    }

    // Obtener últimos turnos
    const turnosData = await $fetch('/api/turnos?limit=5', {
      headers: {
        authorization: `Bearer ${token.value}`
      },
      params
    })

    lastTurnos.value = turnosData.data

  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const handleLogout = () => {
  logout()
}

const downloadExcel = async () => {
  try {
    // Obtener TODOS los turnos (sin límite)
    const allTurnosData = await $fetch('/api/turnos?limit=10000', {
      headers: {
        authorization: `Bearer ${token.value}`
      }
    })

    // Preparar datos para Excel
    const excelData = allTurnosData.data.map((turno: any) => ({
      'Fecha': formatDate(turno.fecha),
      'Tipo': turno.letra,
      'Número': turno.numero,
      'Módulo': turno.modulo,
      'Tiempo (seg)': turno.tiempo || '-',
      'Observación': turno.observacion || '-'
    }))

    // Crear workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 12 },  // Fecha
      { wch: 6 },   // Tipo
      { wch: 8 },   // Número
      { wch: 8 },   // Módulo
      { wch: 12 },  // Tiempo
      { wch: 30 }   // Observación
    ]
    ws['!cols'] = colWidths

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos')

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0]
    const fileName = `turnos_claro_${fecha}.xlsx`

    // Descargar archivo
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
  gap 16px
  margin-bottom 24px

  @media (max-width: 768px)
    margin-bottom 20px
    flex-direction column
    align-items stretch

  .date-filters
    display flex
    gap 12px
    align-items center

    @media (max-width: 768px)
      flex-direction column
      gap 8px

    .date-input-group
      display flex
      align-items center
      gap 8px

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

        &:hover
          background-color #f8f9fa
          border-color #e30613
          box-shadow 0 2px 8px rgba(227, 6, 19, 0.15)

        &:focus
          border-color #e30613
          box-shadow 0 0 0 3px rgba(227, 6, 19, 0.1)

  .filter-select
    padding 10px 40px 10px 20px
    background white
    color #333
    border 1px solid #e0e0e0
    border-radius 8px
    cursor pointer
    font-size 14px
    font-weight 600
    transition all 0.3s ease
    outline none
    appearance none
    background-image url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")
    background-repeat no-repeat
    background-position right 15px center
    box-shadow 0 2px 4px rgba(0, 0, 0, 0.08)

    @media (max-width: 768px)
      font-size 12px
      padding 8px 32px 8px 16px
      background-position right 12px center

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

.time-cycle-section
  display grid
  grid-template-columns 3fr 1fr
  gap 24px
  margin-bottom 40px

  @media (max-width: 1024px)
    grid-template-columns 1fr
    gap 16px

  .time-cycle-card
    background white
    border-radius 12px
    padding 24px
    box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
    border-left 4px solid #e30613

    @media (max-width: 768px)
      padding 16px

    .cycle-header
      margin-bottom 24px

      @media (max-width: 768px)
        margin-bottom 16px

      .cycle-title
        display flex
        align-items center
        gap 12px

        h3
          margin 0
          font-size 18px
          color #333
          font-weight 600

          @media (max-width: 768px)
            font-size 16px

    .cycle-body
      display flex
      align-items center
      justify-content space-between
      gap 16px
      flex-wrap wrap

      @media (max-width: 768px)
        flex-direction column
        gap 12px

      .time-item
        flex 1
        display flex
        align-items center
        gap 12px
        background #f8f9fa
        padding 16px
        border-radius 10px
        min-width 140px
        transition all 0.3s ease

        @media (max-width: 768px)
          width 100%
          padding 12px

        &:hover
          transform translateY(-2px)
          box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)

        &.time-total
          background linear-gradient(135deg, #e30613, #c50510)
          border 2px solid #e30613

          .time-info
            .time-label
              color white

            .time-value
              color white
              font-weight 700

        .time-icon
          display flex
          align-items center
          justify-content center
          width 40px
          height 40px
          background white
          border-radius 50%
          flex-shrink 0

          @media (max-width: 768px)
            width 32px
            height 32px

          img
            width 24px
            height 24px

            @media (max-width: 768px)
              width 20px
              height 20px

        .time-info
          display flex
          flex-direction column
          gap 4px
          flex 1

          .time-label
            font-size 12px
            color #666
            font-weight 500
            text-transform uppercase
            letter-spacing 0.5px

            @media (max-width: 768px)
              font-size 11px

          .time-value
            font-size 20px
            color #333
            font-weight 700

            @media (max-width: 768px)
              font-size 18px

            &.total
              font-size 24px

              @media (max-width: 768px)
                font-size 20px

      .time-divider
        font-size 24px
        color #e30613
        font-weight 700
        flex-shrink 0

        @media (max-width: 768px)
          transform rotate(90deg)
          font-size 20px

.charts-grid-top
  display grid
  grid-template-columns repeat(3, 1fr)
  gap 24px
  margin-bottom 24px
  width 100%
  max-width 100%

  @media (max-width: 1200px)
    grid-template-columns repeat(2, 1fr)

  @media (max-width: 768px)
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

.turnos-table
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

  &.badge-M
    background #667eea20
    color #667eea

  &.badge-E
    background #43e97b20
    color #43e97b

  &.badge-V
    background #fa709a20
    color #fa709a

  &.badge-RR
    background #764ba220
    color #764ba2

  &.badge-H
    background #4facfe20
    color #4facfe
</style>

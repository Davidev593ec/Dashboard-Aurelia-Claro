<template>
  <div class="chart-container" ref="chartContainer">
    <Line :data="chartData" :options="chartOptions" :key="chartKey" />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement)

const props = defineProps<{
  data: {
    labels: string[]
    values: number[]
  }
  title?: string
}>()

const chartKey = ref(0)
const chartContainer = ref<HTMLElement>()

onMounted(() => {
  window.addEventListener('resize', () => {
    chartKey.value++
  })
})

const chartData = computed(() => ({
  labels: props.data.labels,
  datasets: [
    {
      label: 'Turnos por día',
      data: props.data.values,
      backgroundColor: 'rgba(227, 6, 19, 0.1)',
      borderColor: '#e30613',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#e30613',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: {
        size: 16,
        weight: 'bold' as const
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.chart-container
  height 300px
  position relative
  width 100%
  max-width 100%
  overflow hidden

  @media (max-width: 768px)
    height 250px
</style>

<template>
  <div class="chart-container" ref="chartContainer">
    <Doughnut :data="chartData" :options="chartOptions" :key="chartKey" />
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, ChartDataLabels)

const props = defineProps<{
  data: {
    labels: string[]
    values: number[]
    colors?: string[]
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
      data: props.data.values,
      backgroundColor: props.data.colors && props.data.colors.length > 0
        ? props.data.colors
        : [
            '#2ecc71',  // Verde para atendidos
            '#e74c3c',  // Rojo para abandonados
          ],
      borderWidth: 3,
      borderColor: '#fff',
      hoverOffset: 8
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%', // Esto hace que sea un donut en lugar de pie
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        font: {
          size: 13,
          weight: '600' as const
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: {
        size: 16,
        weight: 'bold' as const
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} turnos (${percentage}%)`
        }
      }
    },
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold' as const,
        size: 16
      },
      formatter: (value: number) => {
        return value
      }
    }
  }
}))
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

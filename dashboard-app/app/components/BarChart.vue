<template>
  <div class="chart-container" ref="chartContainer">
    <Bar :data="chartData" :options="chartOptions" :key="chartKey" />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels)

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
      label: 'Turnos',
      data: props.data.values,
      backgroundColor: 'rgba(227, 6, 19, 0.8)',
      borderColor: '#e30613',
      borderWidth: 2,
      borderRadius: 8
    }
  ]
}))

const chartOptions = computed(() => ({
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
    },
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold' as const,
        size: 12
      },
      formatter: (value: number) => {
        return value
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

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
  PointElement,
  Filler
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const props = defineProps<{
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      color: string
    }>
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
  datasets: props.data.datasets.map(dataset => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: `${dataset.color}20`,
    borderColor: dataset.color,
    borderWidth: 3,
    fill: true,
    tension: 0.4,
    pointBackgroundColor: dataset.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 6,
    pointHoverRadius: 8,
    pointHoverBorderWidth: 3
  }))
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
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
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: 16,
      titleFont: {
        size: 14,
        weight: 'bold' as const
      },
      bodyFont: {
        size: 14,
        weight: '600' as const
      },
      callbacks: {
        title: function(context: any) {
          return context[0].label
        },
        label: function(context: any) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          label += context.parsed.y.toLocaleString() + ' turnos'
          return label
        },
        afterBody: function(context: any) {
          const total = context.reduce((sum: number, item: any) => sum + item.parsed.y, 0)
          return '\nTotal del día: ' + total.toLocaleString() + ' turnos'
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 12
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        },
        maxRotation: 45,
        minRotation: 0
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.chart-container
  height 350px
  position relative
  width 100%
  max-width 100%
  overflow hidden

  @media (max-width: 768px)
    height 280px
</style>

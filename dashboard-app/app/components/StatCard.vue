<template>
  <div class="stat-card">
    <div class="stat-icon" :style="{ backgroundColor: color + '20', color: color }">
      <slot name="icon">📊</slot>
    </div>
    <div class="stat-content">
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string | number
  label: string
  color?: string
}>()
</script>

<style lang="stylus" scoped>
.stat-card
  background white
  border-radius 12px
  padding 24px
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.08)
  display flex
  align-items center
  gap 16px
  transition all 0.3s ease

  &:hover
    transform translateY(-4px)
    box-shadow 0 8px 24px rgba(0, 0, 0, 0.12)

.stat-icon
  width 56px
  height 56px
  border-radius 12px
  display flex
  align-items center
  justify-content center
  font-size 24px
  background-color rgba(227, 6, 19, 0.10) !important
  color #333 !important

.stat-content
  flex 1

  .stat-value
    font-size 32px
    font-weight 700
    color #333
    line-height 1

  .stat-label
    font-size 14px
    color #666
    margin-top 8px
</style>

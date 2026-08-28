<template>
  <AdminLayout>
    <div class="dashboard">
      <!-- 顶部欢迎区 -->
      <section class="welcome-banner">
        <div class="welcome-text">
          <h2>数据概览</h2>
          <p>欢迎回来，{{ adminName }}！以下是平台运营数据实时统计。</p>
        </div>
        <div class="welcome-meta">
          <el-icon :size="20"><Calendar /></el-icon>
          <span>{{ todayLabel }}</span>
        </div>
      </section>

      <!-- 核心指标卡片 -->
      <el-row :gutter="16" class="stats-row">
        <el-col v-for="stat in statCards" :key="stat.key" :xs="12" :sm="12" :md="6">
          <div class="stat-card" :style="{ '--accent': stat.color }">
            <div class="stat-icon-wrap">
              <el-icon :size="22"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ formatNum(data[stat.key]) }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 图表区 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="14">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title">
                <el-icon :size="18"><TrendCharts /></el-icon>
                <span>近 7 日增长趋势</span>
              </div>
            </div>
            <div ref="trendChartRef" class="chart-box"></div>
          </div>
        </el-col>
        <el-col :xs="24" :lg="10">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title">
                <el-icon :size="18"><PieChart /></el-icon>
                <span>菜谱难度分布</span>
              </div>
            </div>
            <div ref="difficultyChartRef" class="chart-box chart-box--pie"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-row">
        <el-col :xs="24" :lg="12">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title">
                <el-icon :size="18"><Histogram /></el-icon>
                <span>菜系菜谱数量</span>
              </div>
            </div>
            <div ref="cuisineChartRef" class="chart-box"></div>
          </div>
        </el-col>
        <el-col :xs="24" :lg="12">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-title">
                <el-icon :size="18"><Trophy /></el-icon>
                <span>热门菜谱 TOP 5</span>
              </div>
            </div>
            <div ref="hotChartRef" class="chart-box"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 热门排行详情 -->
      <div class="panel-card ranking-panel">
        <div class="panel-header">
          <div class="panel-title">
            <el-icon :size="18"><Medal /></el-icon>
            <span>热门菜谱详情</span>
          </div>
        </div>
        <el-table
          :data="data.topRecipes || []"
          stripe
          style="width: 100%"
          empty-text="暂无数据"
          class="ranking-table"
        >
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ $index }">
              <span class="rank-num" :class="'rank-' + ($index + 1)">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="菜谱名称" min-width="180" show-overflow-tooltip />
          <el-table-column label="难度" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="difficultyType(row.difficulty)" size="small" effect="light" round>
                {{ difficultyLabel(row.difficulty) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="favoriteCount" label="收藏" width="100" align="center">
            <template #default="{ row }">
              <span class="metric-text metric-fav">{{ row.favoriteCount || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="浏览" width="100" align="center">
            <template #default="{ row }">
              <span class="metric-text metric-view">{{ row.viewCount || 0 }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import * as echarts from 'echarts'
import {
  User,
  Bowl,
  Star,
  View,
  TrendCharts,
  PieChart,
  Histogram,
  Trophy,
  Medal,
  Calendar
} from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'

const adminName = localStorage.getItem('admin_name') || '管理员'
const data = ref({})
const trendChartRef = ref(null)
const difficultyChartRef = ref(null)
const cuisineChartRef = ref(null)
const hotChartRef = ref(null)
const charts = shallowRef([])

const COLORS = ['#E53935', '#EF5350', '#4a8c5c', '#FF7043', '#6b8f9e', '#C62828', '#E57373', '#5c8a8a']

const todayLabel = computed(() => {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
})

const statCards = [
  { key: 'userCount', label: '总用户数', icon: User, color: '#E53935' },
  { key: 'recipeCount', label: '总菜谱数', icon: Bowl, color: '#4a8c5c' },
  { key: 'favoriteCount', label: '总收藏数', icon: Star, color: '#e8a317' },
  { key: 'viewCount', label: '总浏览量', icon: View, color: '#6b8f9e' }
]

const formatNum = (n) => {
  const num = Number(n) || 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num.toLocaleString()
}

const difficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || '未知')
const difficultyType = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger' }[d] || 'info')

const initChart = (el) => {
  if (!el) return null
  const chart = echarts.init(el)
  charts.value.push(chart)
  return chart
}

const baseTooltip = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#ebeef5',
  borderWidth: 1,
  textStyle: { color: '#303133', fontSize: 13 },
  extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;'
}

const renderTrendChart = () => {
  const chart = initChart(trendChartRef.value)
  if (!chart) return
  const trends = data.value.trends || []
  chart.setOption({
    color: ['#E53935', '#4a8c5c'],
    tooltip: { trigger: 'axis', ...baseTooltip },
    legend: { data: ['新增用户', '新增菜谱'], bottom: 0, itemGap: 24, textStyle: { color: '#606266' } },
    grid: { left: 48, right: 24, top: 24, bottom: 48 },
    xAxis: {
      type: 'category',
      data: trends.map((t) => t.date),
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } },
      axisLabel: { color: '#909399' }
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(229,57,53,0.25)' },
            { offset: 1, color: 'rgba(229,57,53,0.02)' }
          ])
        },
        data: trends.map((t) => t.userCount)
      },
      {
        name: '新增菜谱',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(74,140,92,0.25)' },
            { offset: 1, color: 'rgba(74,140,92,0.02)' }
          ])
        },
        data: trends.map((t) => t.recipeCount)
      }
    ]
  })
}

const renderDifficultyChart = () => {
  const chart = initChart(difficultyChartRef.value)
  if (!chart) return
  const stats = data.value.difficultyStats || []
  chart.setOption({
    color: COLORS,
    tooltip: { trigger: 'item', ...baseTooltip, formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { color: '#606266' } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 600 } },
      data: stats.length ? stats.map((s) => ({ name: s.name, value: s.value })) : [{ name: '暂无数据', value: 0 }]
    }]
  })
}

const renderCuisineChart = () => {
  const chart = initChart(cuisineChartRef.value)
  if (!chart) return
  const stats = data.value.cuisineStats || []
  if (!stats.length) {
    chart.setOption({
      title: {
        text: '暂无菜系统计数据',
        subtext: '请为菜谱勾选菜系分类后查看',
        left: 'center',
        top: 'center',
        textStyle: { color: '#909399', fontSize: 14, fontWeight: 500 },
        subtextStyle: { color: '#c0c4cc', fontSize: 12 }
      }
    })
    return
  }
  chart.setOption({
    color: ['#E53935'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...baseTooltip },
    grid: { left: 48, right: 24, top: 16, bottom: stats.length > 5 ? 56 : 32 },
    xAxis: {
      type: 'category',
      data: stats.map((s) => s.name),
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266', rotate: stats.length > 5 ? 30 : 0, fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } },
      axisLabel: { color: '#909399' }
    },
    series: [{
      type: 'bar',
      barWidth: 28,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#EF5350' },
          { offset: 1, color: '#E53935' }
        ])
      },
      data: stats.map((s) => s.value)
    }]
  })
}

const renderHotChart = () => {
  const chart = initChart(hotChartRef.value)
  if (!chart) return
  const recipes = data.value.topRecipes || []
  const titles = recipes.map((r) => r.title).reverse()
  chart.setOption({
    color: ['#E53935', '#6b8f9e'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...baseTooltip },
    legend: { data: ['收藏', '浏览'], bottom: 0, textStyle: { color: '#606266' } },
    grid: { left: 100, right: 24, top: 16, bottom: 40 },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'category',
      data: titles,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#606266', width: 80, overflow: 'truncate' }
    },
    series: [
      {
        name: '收藏',
        type: 'bar',
        stack: 'total',
        barWidth: 16,
        itemStyle: { borderRadius: [0, 0, 0, 0] },
        data: recipes.map((r) => r.favoriteCount).reverse()
      },
      {
        name: '浏览',
        type: 'bar',
        stack: 'total',
        barWidth: 16,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        data: recipes.map((r) => r.viewCount).reverse()
      }
    ]
  })
}

const renderAllCharts = () => {
  charts.value.forEach((c) => c.dispose())
  charts.value = []
  renderTrendChart()
  renderDifficultyChart()
  renderCuisineChart()
  renderHotChart()
}

const handleResize = () => {
  charts.value.forEach((c) => c.resize())
}

onMounted(async () => {
  data.value = await api.get('/api/admin/dashboard')
  await nextTick()
  renderAllCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  charts.value.forEach((c) => c.dispose())
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 欢迎横幅 */
.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(135deg, #fff 0%, var(--theme-primary-pale) 100%);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(211, 84, 0, 0.06);
}

.welcome-text h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--theme-text);
}

.welcome-text p {
  margin: 0;
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.welcome-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid var(--theme-border);
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

/* 指标卡片 */
.stats-row {
  margin: 0 !important;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--theme-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  margin-bottom: 16px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 12%, white);
  color: var(--accent);
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

/* 图表面板 */
.chart-row {
  margin: 0 !important;
}

.panel-card {
  background: #fff;
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-title .el-icon {
  color: var(--theme-primary);
}

.chart-box {
  width: 100%;
  height: 300px;
}

.chart-box--pie {
  height: 280px;
}

/* 排行表格 */
.ranking-panel {
  margin-bottom: 0;
}

.ranking-table :deep(.el-table__header th) {
  background: #fafafa !important;
  font-weight: 600;
}

.rank-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  background: #f0f2f5;
  color: #909399;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  color: #7a5c00;
}

.rank-2 {
  background: linear-gradient(135deg, #e0e0e0, #c0c0c0);
  color: #555;
}

.rank-3 {
  background: linear-gradient(135deg, #EF9A9A, #E53935);
  color: #fff;
}

.metric-text {
  font-weight: 600;
  font-size: 14px;
}

.metric-fav {
  color: var(--theme-primary);
}

.metric-view {
  color: #7b9eb8;
}

@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .chart-box {
    height: 260px;
  }
}
</style>

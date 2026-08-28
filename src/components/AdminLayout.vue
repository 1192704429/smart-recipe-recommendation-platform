<template>
  <el-container class="layout-container">
    <el-aside width="232px" class="layout-aside">
      <div class="brand">
        <div class="brand-icon-wrap">
          <span class="brand-icon">🍳</span>
        </div>
        <div class="brand-info">
          <span class="brand-text">今日食单</span>
          <span class="brand-sub">管理后台</span>
        </div>
      </div>

      <el-menu
        :default-active="route.path"
        router
        class="side-menu"
        background-color="transparent"
        text-color="var(--theme-sidebar-text)"
        active-text-color="var(--theme-sidebar-active-text)"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="layout-right">
      <el-header class="layout-header">
        <div class="header-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="admin-info">
          <el-avatar :size="34" class="admin-avatar">{{ adminName.charAt(0) }}</el-avatar>
          <span class="admin-name">{{ adminName }}</span>
          <el-divider direction="vertical" />
          <el-button type="primary" link class="logout-btn" @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="layout-main">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataAnalysis,
  User,
  Bowl,
  Menu,
  Apple,
  Select,
  Picture
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminName = localStorage.getItem('admin_name') || '管理员'

const menuItems = [
  { path: '/dashboard', icon: DataAnalysis, label: '仪表盘' },
  { path: '/users', icon: User, label: '用户管理' },
  { path: '/recipes', icon: Bowl, label: '菜谱管理' },
  { path: '/categories', icon: Menu, label: '分类管理' },
  { path: '/ingredients', icon: Apple, label: '食材管理' },
  { path: '/audit', icon: Select, label: '菜谱审核' },
  { path: '/banners', icon: Picture, label: '轮播图管理' }
]

const pageTitles = {
  '/dashboard': '仪表盘',
  '/users': '用户管理',
  '/recipes': '菜谱管理',
  '/categories': '分类管理',
  '/ingredients': '食材管理',
  '/audit': '菜谱审核',
  '/banners': '轮播图管理'
}
const pageTitle = computed(() => pageTitles[route.path] || '管理后台')

const logout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_name')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-aside {
  background: var(--theme-sidebar);
  border-right: 1px solid var(--theme-border);
  box-shadow: 2px 0 16px rgba(44, 36, 35, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--theme-border);
  flex-shrink: 0;
}

.brand-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, #EF6B62 0%, #D84339 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(216, 67, 57, 0.28);
  flex-shrink: 0;
}

.brand-icon {
  font-size: 20px;
  line-height: 1;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.brand-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.3px;
}

.brand-sub {
  font-size: 11px;
  color: var(--theme-text-secondary);
  letter-spacing: 1px;
}

.side-menu {
  border-right: none;
  flex: 1;
  padding: 12px 10px;
  --el-menu-hover-bg-color: var(--theme-sidebar-hover);
  --el-menu-bg-color: transparent;
}

.side-menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin-bottom: 4px;
  padding-left: 14px !important;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-sidebar-text);
  transition: background-color 0.2s, color 0.2s;
}

.side-menu :deep(.el-menu-item .el-icon) {
  font-size: 17px;
  margin-right: 10px;
  color: inherit;
  transition: color 0.2s;
}

.side-menu :deep(.el-menu-item:hover) {
  background-color: var(--theme-sidebar-hover) !important;
  color: var(--theme-text);
}

.side-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, var(--theme-primary-pale) 0%, rgba(255, 243, 242, 0.5) 100%) !important;
  color: var(--theme-primary) !important;
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--theme-primary);
}

.side-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--theme-primary);
}

.layout-right {
  min-width: 0;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 28px;
  background: var(--theme-surface);
  border-bottom: 1px solid var(--theme-border);
  box-shadow: 0 1px 4px rgba(44, 36, 35, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--theme-text);
  position: relative;
  padding-left: 12px;
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--theme-primary);
  border-radius: 2px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-info :deep(.el-divider--vertical) {
  margin: 0 4px;
  border-color: var(--theme-border);
}

.admin-avatar {
  background: linear-gradient(135deg, #EF6B62, #D84339);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.admin-name {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.logout-btn {
  font-size: 13px;
  color: var(--theme-text-secondary) !important;
}

.logout-btn:hover {
  color: var(--theme-primary) !important;
}

.layout-main {
  background: var(--theme-bg);
  padding: 20px 28px;
}
</style>

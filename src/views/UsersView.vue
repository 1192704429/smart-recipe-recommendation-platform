<template>
  <AdminLayout>
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="var(--theme-primary)"><User /></el-icon>
            <span>用户管理</span>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="search.keyword"
          placeholder="搜索用户名 / 昵称 / 手机号"
          clearable
          style="width:260px"
          @keyup.enter="load"
        />
        <el-select v-model="search.loginType" placeholder="全部类型" clearable style="width:130px">
          <el-option label="账号用户" value="account" />
        </el-select>
        <el-select v-model="search.status" placeholder="全部状态" clearable style="width:130px">
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="load" :icon="Search">查询</el-button>
        <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        <el-tag type="info" effect="plain">共 {{ filteredList.length }} 位用户</el-tag>
      </div>

      <el-table :data="filteredList" border stripe style="width: 100%" empty-text="暂无数据">
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">{{ row.id }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="42" :src="imgUrl(row.avatar)" :alt="row.nickname">
                {{ (row.nickname || row.username || 'U')[0] }}
              </el-avatar>
              <div class="user-info">
                <div class="user-nickname">{{ row.nickname || '未设置昵称' }}</div>
                <div class="user-sub">{{ row.username ? '@' + row.username : '未绑定账号' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="登录方式" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="loginTypeTag(row.loginType).type" effect="plain" size="small">
              {{ loginTypeTag(row.loginType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="130" align="center">
          <template #default="{ row }">
            <span>{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="80" align="center">
          <template #default="{ row }">
            <span>{{ genderText(row.gender) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain" size="small" round>
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" size="small">
              {{ row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              :type="row.status === 1 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row)"
              :icon="row.status === 1 ? CircleClose : CircleCheck"
            >{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Search, Refresh, CircleClose, CircleCheck } from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'

const BASE = 'http://127.0.0.1:8080'
const imgUrl = (path) => (path?.startsWith('http') ? path : BASE + path)

const list = ref([])
const search = reactive({ keyword: '', loginType: '', status: '' })

const filteredList = computed(() => {
  if (!search.loginType) return list.value
  return list.value.filter((item) => item.loginType === search.loginType)
})

const genderText = (gender) => ({ 0: '保密', 1: '男', 2: '女' }[gender] ?? '保密')

const loginTypeTag = (type) => ({
  account: { label: '账号', type: 'primary' },
  unknown: { label: '其他', type: 'info' }
}[type] || { label: '其他', type: 'info' })

const load = async () => {
  const params = {}
  if (search.keyword) params.keyword = search.keyword
  if (search.status !== '') params.status = search.status
  list.value = await api.get('/api/admin/users', { params })
}

const resetSearch = () => {
  search.keyword = ''
  search.loginType = ''
  search.status = ''
  load()
}

const displayName = (row) => row.nickname || row.username || `用户${row.id}`

const toggleStatus = async (row) => {
  const action = row.status === 1 ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定要${action}用户「${displayName(row)}」吗？`, '提示', { type: 'warning' })
  await api.put(`/api/admin/users/${row.id}/status`, null, { params: { status: row.status === 1 ? 0 : 1 } })
  ElMessage.success(`已${action}`)
  load()
}

onMounted(load)
</script>

<style scoped>
.main-card {
  border-radius: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text);
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  flex: 1;
}
.user-nickname {
  font-weight: 600;
  color: var(--theme-text);
  margin-bottom: 4px;
}
.user-sub {
  font-size: 12px;
  color: #909399;
}
</style>

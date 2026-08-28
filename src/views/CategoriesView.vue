<template>
  <AdminLayout>
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="var(--theme-primary)"><Menu /></el-icon>
            <span>分类管理</span>
          </div>
          <el-button type="primary" @click="openAdd" :icon="Plus">
            新增分类
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-select v-model="filterType" placeholder="分类类型" clearable style="width:160px" @change="handleFilter">
          <el-option label="全部" value="" />
          <el-option label="🍳 菜系" value="菜系" />
          <el-option label="👅 口味" value="口味" />
          <el-option label="👥 人群" value="人群" />
          <el-option label="⚠️ 禁忌" value="禁忌" />
        </el-select>
        <el-tag type="info" effect="plain">共 {{ total }} 条分类</el-tag>
      </div>

      <el-table :data="list" border stripe style="width: 100%" empty-text="暂无数据">
      <el-table-column prop="name" label="分类名称" min-width="180">
        <template #default="{ row }">
          <div class="category-name">
            <span class="category-icon">{{ row.icon || '📋' }}</span>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类类型" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)" effect="plain" size="small" round>
            {{ typeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="info" effect="plain" size="small">{{ row.sort }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openEdit(row)" :icon="Edit">编辑</el-button>
          <el-button type="danger" size="small" @click="del(row)" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <AdminPagination
      v-model:current-page="pageNum"
      :page-size="pageSize"
      :total="total"
      @change="load"
    />

    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? '编辑分类' : '新增分类'"
      direction="rtl"
      size="420px"
      class="form-drawer"
      destroy-on-close
    >
      <div class="drawer-body">
        <el-form :model="form" label-width="80px">
          <el-form-item label="分类名称" required>
            <el-input v-model="form.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="分类类型" required>
            <el-select v-model="form.type" style="width:100%">
              <el-option label="菜系" value="菜系" />
              <el-option label="口味" value="口味" />
              <el-option label="人群" value="人群" />
              <el-option label="禁忌" value="禁忌" />
            </el-select>
          </el-form-item>
          <el-form-item label="图标">
            <el-input v-model="form.icon" placeholder="emoji 或图标文字" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" style="width:100%" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </template>
    </el-drawer>
    </el-card>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Menu } from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'
import AdminPagination from '../components/AdminPagination.vue'

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const filterType = ref('')
const drawerVisible = ref(false)
const saving = ref(false)
const form = reactive(emptyForm())

const typeLabel = (t) => t || '未知'
const getTypeTag = (t) => {
  const map = { '菜系': '', '口味': 'warning', '人群': 'success', '禁忌': 'danger' }
  return map[t] || 'info'
}

function emptyForm() {
  return { id: null, name: '', type: '菜系', icon: '', sort: 0, status: 1 }
}

const load = async () => {
  const params = { pageNum: pageNum.value, pageSize: pageSize.value }
  if (filterType.value) params.type = filterType.value
  const res = await api.get('/api/admin/categories', { params })
  list.value = res.list || []
  total.value = res.total || 0
}

const handleFilter = () => {
  pageNum.value = 1
  load()
}

const openAdd = () => { Object.assign(form, emptyForm()); drawerVisible.value = true }
const openEdit = (row) => { Object.assign(form, { ...emptyForm(), ...row }); drawerVisible.value = true }

const save = async () => {
  if (!form.name) { ElMessage.warning('请输入分类名称'); return }
  if (!form.type) { ElMessage.warning('请选择分类类型'); return }
  saving.value = true
  try {
    await api.post('/api/admin/categories', { ...form })
    ElMessage.success('保存成功')
    drawerVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

const del = async (row) => {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '提示', { type: 'warning' })
  await api.delete(`/api/admin/categories/${row.id}`)
  ElMessage.success('已删除')
  if (list.value.length === 1 && pageNum.value > 1) pageNum.value--
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
.category-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}
.category-icon {
  font-size: 18px;
}
</style>

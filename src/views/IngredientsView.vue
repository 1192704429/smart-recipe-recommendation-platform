<template>
  <AdminLayout>
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="var(--theme-primary)"><Van /></el-icon>
            <span>食材管理</span>
          </div>
          <el-button type="primary" @click="openAdd" :icon="Plus">
            新增食材
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="🔍 搜索食材名称"
          clearable
          style="width:260px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
        <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        <el-tag type="info" effect="plain">共 {{ total }} 种食材</el-tag>
      </div>

      <el-row v-if="list.length" :gutter="16" class="ingredient-grid">
        <el-col
          v-for="item in list"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card shadow="hover" class="ingredient-card">
            <div class="card-cover">
              <el-image
                v-if="item.image"
                :src="imgUrl(item.image)"
                fit="cover"
                class="cover-img"
                :preview-src-list="[imgUrl(item.image)]"
              />
              <div v-else class="cover-placeholder">
                <el-icon :size="36" color="#dcdfe6"><Van /></el-icon>
              </div>
            </div>
            <div class="card-body">
              <div class="card-title-row">
                <span class="card-name">{{ item.name }}</span>
                <el-tag type="info" effect="plain" size="small">{{ item.unit || '-' }}</el-tag>
              </div>
              <p class="card-desc">{{ item.description || '暂无描述' }}</p>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="openEdit(item)" :icon="Edit">编辑</el-button>
              <el-button type="danger" size="small" @click="del(item)" :icon="Delete">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-else description="暂无数据" />

      <AdminPagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        @change="load"
      />

      <el-drawer
        v-model="drawerVisible"
        :title="form.id ? '编辑食材' : '新增食材'"
        direction="rtl"
        size="420px"
        class="form-drawer"
        destroy-on-close
      >
        <div class="drawer-body">
          <el-form :model="form" label-width="80px">
            <el-form-item label="食材名称" required>
              <el-input v-model="form.name" placeholder="请输入食材名称" />
            </el-form-item>
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="如：克、个、毫升" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="食材介绍" />
            </el-form-item>
            <el-form-item label="食材图片">
              <div class="img-row">
                <div class="img-preview" v-if="form.image">
                  <el-image :src="imgUrl(form.image)" class="img-preview" fit="cover" />
                </div>
                <el-upload
                  action="http://127.0.0.1:8080/api/admin/upload"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  accept="image/*"
                  :on-success="(res) => { if(res.code===200) form.image=res.data; else ElMessage.error(res.message||'上传失败') }"
                  :on-error="() => ElMessage.error('上传失败')"
                >
                  <div class="img-upload-btn">
                    <el-icon :size="24" color="#bbb"><Plus /></el-icon>
                  </div>
                </el-upload>
              </div>
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
import { Plus, Edit, Delete, Van, Search, Refresh } from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'
import AdminPagination from '../components/AdminPagination.vue'

const BASE = 'http://127.0.0.1:8080'
const imgUrl = (path) => path?.startsWith('http') ? path : BASE + path
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(8)
const keyword = ref('')
const drawerVisible = ref(false)
const saving = ref(false)
const form = reactive(emptyForm())

function emptyForm() {
  return { id: null, name: '', unit: '', description: '', image: '' }
}

const load = async () => {
  const params = { pageNum: pageNum.value, pageSize: pageSize.value }
  if (keyword.value) params.keyword = keyword.value
  const res = await api.get('/api/admin/ingredients', { params })
  list.value = res.list || []
  total.value = res.total || 0
}

const handleSearch = () => {
  pageNum.value = 1
  load()
}

const resetSearch = () => {
  keyword.value = ''
  pageNum.value = 1
  load()
}

const openAdd = () => { Object.assign(form, emptyForm()); drawerVisible.value = true }
const openEdit = (row) => { Object.assign(form, { ...emptyForm(), ...row }); drawerVisible.value = true }

const save = async () => {
  if (!form.name) { ElMessage.warning('请输入食材名称'); return }
  saving.value = true
  try {
    await api.post('/api/admin/ingredients', { ...form })
    ElMessage.success('保存成功')
    drawerVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

const del = async (row) => {
  await ElMessageBox.confirm(`确定删除食材「${row.name}」吗？`, '提示', { type: 'warning' })
  await api.delete(`/api/admin/ingredients/${row.id}`)
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
.ingredient-grid {
  margin-top: 4px;
}
.ingredient-card {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ingredient-card:hover {
  transform: translateY(-2px);
}
.card-cover {
  height: 140px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f7fa;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #ebeef5 100%);
}
.card-body {
  padding: 12px 0 8px;
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--theme-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-desc {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--theme-border);
}
.card-actions .el-button {
  flex: 1;
}
.img-row { display: flex; align-items: center; gap: 10px; }
.img-preview {
  width: 100px; height: 100px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
}
.img-upload-btn {
  width: 100px; height: 100px; border: 1.5px dashed #d9d9d9; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: border-color .2s;
  background: white;
}
.img-upload-btn:hover { border-color: var(--theme-primary); }
.img-upload-btn:hover .el-icon { color: var(--theme-primary) !important; }
</style>

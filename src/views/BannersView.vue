<template>
  <AdminLayout>
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="var(--theme-primary)"><Picture /></el-icon>
            <span>轮播图管理</span>
          </div>
          <el-button type="primary" @click="openAdd" :icon="Plus">
            新增轮播图
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-tag type="info" effect="plain">共 {{ list.length }} 张轮播图</el-tag>
      </div>

      <el-table :data="list" border stripe style="width: 100%" empty-text="暂无数据">
      <el-table-column label="轮播图预览" min-width="280">
        <template #default="{ row }">
          <div class="banner-cell">
            <el-image
              :src="imgUrl(row.image)"
              class="banner-img"
              fit="cover"
              :preview-src-list="[imgUrl(row.image)]"
            />
            <div class="banner-info">
              <div class="banner-title">{{ row.title || '无标题' }}</div>
              <div class="banner-meta">
                <el-tag v-if="row.linkType" size="small" type="warning" effect="plain">
                  {{ getLinkTypeLabel(row.linkType) }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="info" effect="plain" size="small">{{ row.sort }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain" size="small" round>
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openEdit(row)" :icon="Edit">编辑</el-button>
          <el-button type="danger" size="small" @click="del(row)" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? '编辑轮播图' : '新增轮播图'"
      direction="rtl"
      size="460px"
      class="form-drawer"
      destroy-on-close
    >
      <div class="drawer-body">
        <el-form :model="form" label-width="90px">
          <el-form-item label="标题">
            <el-input v-model="form.title" placeholder="轮播图标题（选填）" />
          </el-form-item>
          <el-form-item label="轮播图" required>
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
                  <el-icon :size="28" color="#bbb"><Plus /></el-icon>
                </div>
              </el-upload>
            </div>
          </el-form-item>
          <el-form-item label="跳转类型">
            <el-select v-model="form.linkType" style="width:100%" clearable placeholder="选填">
              <el-option label="菜谱详情" value="recipe" />
              <el-option label="分类列表" value="category" />
              <el-option label="外部链接" value="url" />
            </el-select>
          </el-form-item>
          <el-form-item label="跳转值">
            <el-input v-model="form.linkValue" placeholder="如：菜谱ID、分类ID 或 URL" />
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
import { Plus, Edit, Delete, Picture } from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'

const getLinkTypeLabel = (type) => {
  const map = { recipe: '菜谱详情', category: '分类列表', url: '外部链接' }
  return map[type] || type
}

const BASE = 'http://127.0.0.1:8080'
const imgUrl = (path) => path?.startsWith('http') ? path : BASE + path
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }

const list = ref([])
const drawerVisible = ref(false)
const saving = ref(false)
const form = reactive(emptyForm())

function emptyForm() {
  return { id: null, title: '', image: '', linkType: '', linkValue: '', sort: 0, status: 1 }
}

const load = async () => {
  list.value = await api.get('/api/admin/banners')
}

const openAdd = () => { Object.assign(form, emptyForm()); drawerVisible.value = true }
const openEdit = (row) => { Object.assign(form, { ...emptyForm(), ...row }); drawerVisible.value = true }

const save = async () => {
  if (!form.image) { ElMessage.warning('请输入图片URL'); return }
  saving.value = true
  try {
    await api.post('/api/admin/banners', { ...form })
    ElMessage.success('保存成功')
    drawerVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

const del = async (row) => {
  await ElMessageBox.confirm(`确定删除轮播图「${row.title || row.id}」吗？`, '提示', { type: 'warning' })
  await api.delete(`/api/admin/banners/${row.id}`)
  ElMessage.success('已删除')
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
.banner-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.banner-img {
  width: 120px;
  height: 60px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.banner-info {
  flex: 1;
}
.banner-title {
  font-weight: 600;
  color: var(--theme-text);
  margin-bottom: 6px;
}
.banner-meta {
  display: flex;
  gap: 8px;
}
.img-row { display: flex; align-items: center; gap: 10px; }
.img-preview {
  width: 200px; height: 120px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
}
.img-upload-btn {
  width: 120px; height: 120px; border: 1.5px dashed #d9d9d9; border-radius: 6px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: border-color .2s;
  background: white;
}
.img-upload-btn:hover { border-color: var(--theme-primary); }
.img-upload-btn:hover .el-icon { color: var(--theme-primary) !important; }
</style>

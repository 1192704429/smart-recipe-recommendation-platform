<template>
  <AdminLayout>
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="var(--theme-primary)"><Select /></el-icon>
            <span>菜谱审核</span>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <el-input v-model="search.keyword" placeholder="搜索菜谱名称" clearable style="width:220px" @keyup.enter="load" />
        <el-select v-model="search.status" placeholder="状态" clearable style="width:120px">
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已驳回" :value="2" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="load">查询</el-button>
        <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
      </div>

      <el-row :gutter="16" class="stat-row">
        <el-col :span="8">
          <el-card shadow="never" class="stat-card pending">
            <div class="stat-num">{{ pendingCount }}</div>
            <div class="stat-label">待审核</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="stat-card passed">
            <div class="stat-num">{{ passedCount }}</div>
            <div class="stat-label">已通过</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="stat-card rejected">
            <div class="stat-num">{{ rejectedCount }}</div>
            <div class="stat-label">已驳回</div>
          </el-card>
        </el-col>
      </el-row>

      <el-table :data="list" border stripe style="width:100%" empty-text="暂无数据">
      <el-table-column prop="id" label="ID" width="60"><template #default="{row}">{{ String(row.id).padStart(2,'0') }}</template></el-table-column>
      <el-table-column label="封面" width="70"><template #default="{row}"><el-image v-if="row.coverImage" :src="imgUrl(row.coverImage)" style="width:44px;height:44px;border-radius:4px" fit="cover" /><span v-else style="color:#bbb">无</span></template></el-table-column>
      <el-table-column prop="title" label="菜谱名称" min-width="140" />
      <el-table-column prop="difficulty" label="难度" width="80"><template #default="{row}">{{ diffMap[row.difficulty]||row.difficulty }}</template></el-table-column>
      <el-table-column prop="cookTime" label="时长" width="80"><template #default="{row}">{{ row.cookTime || '-' }}min</template></el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{row}">
          <el-button v-if="row.status===0" type="success" size="small" @click="doApprove(row)">通过</el-button>
          <el-button v-if="row.status===0" type="danger" size="small" @click="doReject(row)">驳回</el-button>
          <el-button v-if="row.status===1" type="info" size="small" @click="doOffline(row)">下架</el-button>
          <el-button v-if="row.status===2" type="success" size="small" @click="doApprove(row)">重新上架</el-button>
          <el-button size="small" @click="preview(row)">查看</el-button>
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
      v-model="previewVisible"
      title="菜谱详情预览"
      direction="rtl"
      size="600px"
      class="form-drawer"
      destroy-on-close
    >
      <div class="drawer-body">
      <el-form v-if="previewData" :model="previewData" label-width="90px">
        <el-form-item label="菜谱名称"><el-input v-model="previewData.title" readonly /></el-form-item>
        <el-form-item label="描述"><el-input v-model="previewData.description" type="textarea" :rows="2" readonly /></el-form-item>
        <el-form-item label="封面图">
          <div class="img-row">
            <div class="img-preview" v-if="previewData.coverImage">
              <el-image :src="imgUrl(previewData.coverImage)" fit="cover" style="width:100%;height:100%" :preview-src-list="[imgUrl(previewData.coverImage)]" />
            </div>
            <div v-else class="img-upload-btn" style="cursor:default"><span style="color:#bbb;font-size:12px">无封面</span></div>
          </div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="烹饪时长"><el-input :model-value="previewData.cookTime" readonly style="width:100%"><template #suffix><span style="color:#999;font-size:12px;padding-right:4px">分钟</span></template></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="份量"><el-input :model-value="previewData.servings" readonly style="width:100%"><template #suffix><span style="color:#999;font-size:12px;padding-right:4px">人份</span></template></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="热量"><el-input :model-value="previewData.calories" readonly style="width:100%"><template #suffix><span style="color:#999;font-size:12px;padding-right:4px">卡</span></template></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="难度"><el-input :model-value="diffMap[previewData.difficulty] || previewData.difficulty" readonly style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="时令"><el-input :model-value="seasonMap[previewData.season] || previewData.season" readonly style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="菜系"><el-checkbox-group :model-value="(previewData.categories||[]).map(c=>c.id)" disabled><el-checkbox v-for="c in (previewData.categories||[])" :key="c.id" :label="c.name" :value="c.id" /></el-checkbox-group></el-form-item>
        <el-form-item label="适合人群"><el-checkbox-group :model-value="(previewData.crowdTags||'').split(',').filter(Boolean)" disabled><el-checkbox v-for="t in (previewData.crowdTags||'').split(',').filter(Boolean)" :key="t" :label="t" :value="t" /></el-checkbox-group><span v-if="!previewData.crowdTags" style="color:#bbb;font-size:13px">无</span></el-form-item>
        <el-form-item label="食材">
          <div class="ingredient-list">
            <div v-for="(item, idx) in (previewData.ingredients||[])" :key="idx" class="ingredient-row">
              <el-input :model-value="item.ingredientName || item.name || ''" readonly style="width:180px" />
              <el-input :model-value="item.amount" readonly style="width:140px" />
            </div>
            <div v-if="!previewData.ingredients?.length" style="color:#bbb;font-size:13px">无食材</div>
          </div>
        </el-form-item>
        <el-form-item label="步骤">
          <div class="step-list">
            <div v-for="(step, idx) in parsedSteps" :key="idx" class="step-row">
              <div class="step-number">{{ idx + 1 }}</div>
              <el-input :model-value="step.desc || step.description || step" readonly style="flex:1" />
            </div>
            <div v-if="!parsedSteps.length" style="color:#bbb;font-size:13px">无步骤</div>
          </div>
        </el-form-item>
        <el-form-item label="小贴士"><el-input v-model="previewData.tips" type="textarea" :rows="2" readonly /></el-form-item>
        <el-form-item label="状态"><el-tag :type="statusType(previewData.status)" size="default">{{ statusText(previewData.status) }}</el-tag></el-form-item>
        <el-divider content-position="left"><el-icon style="vertical-align:middle;margin-right:4px"><VideoPlay/></el-icon><span>视频教学</span></el-divider>
        <el-form-item label-width="0">
          <div class="video-manage">
            <div v-for="(v, idx) in previewVideos" :key="idx" class="video-row">
              <div class="video-edit-box">
                <div class="video-field"><label>视频标题</label><el-input :model-value="v.title" readonly size="small" /></div>
                <div class="video-field"><label>视频地址</label><el-input :model-value="v.videoUrl" readonly size="small" /></div>
                <div class="video-preview-box" v-if="v.videoUrl"><video :src="imgUrl(v.videoUrl)" controls class="video-thumb" preload="metadata" /></div>
              </div>
            </div>
            <div v-if="!previewVideos.length" style="color:#bbb;font-size:13px;padding:8px 0">暂无视频</div>
          </div>
        </el-form-item>
      </el-form>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="previewVisible=false">关闭</el-button>
          <el-button v-if="previewData && previewData.status===0" type="success" @click="doApprove(previewData);previewVisible=false">通过</el-button>
          <el-button v-if="previewData && previewData.status===0" type="danger" @click="doReject(previewData);previewVisible=false">驳回</el-button>
        </div>
      </template>
    </el-drawer>
    </el-card>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Select, Search, Refresh } from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'
import AdminPagination from '../components/AdminPagination.vue'

const BASE = 'http://127.0.0.1:8080'
const imgUrl = (path) => path?.startsWith('http') ? path : BASE + path
const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
const seasonMap = { spring: '春', summer: '夏', autumn: '秋', winter: '冬', all: '四季' }

const statusText = (s) => s === 1 ? '已通过' : s === 2 ? '已驳回' : '待审核'
const statusType = (s) => s === 1 ? 'success' : s === 2 ? 'danger' : 'warning'

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const search = reactive({ keyword: '', status: null })

const pendingCount = ref(0)
const passedCount = ref(0)
const rejectedCount = ref(0)

const previewVisible = ref(false)
const previewData = ref(null)
const parsedSteps = ref([])
const previewVideos = ref([])

const load = async () => {
  const params = { pageNum: pageNum.value, pageSize: pageSize.value }
  if (search.keyword) params.keyword = search.keyword
  if (search.status !== null && search.status !== '') {
    params.status = search.status
  }
  const res = await api.get('/api/admin/recipes', { params })
  list.value = res.list || []
  total.value = res.total || 0
}

const loadCounts = async () => {
  const [p, a, r] = await Promise.all([
    api.get('/api/admin/recipes', { params: { pageNum: 1, pageSize: 1, status: 0 } }),
    api.get('/api/admin/recipes', { params: { pageNum: 1, pageSize: 1, status: 1 } }),
    api.get('/api/admin/recipes', { params: { pageNum: 1, pageSize: 1, status: 2 } })
  ])
  pendingCount.value = p.total || 0
  passedCount.value = a.total || 0
  rejectedCount.value = r.total || 0
}

const resetSearch = () => { search.keyword = ''; search.status = null; pageNum.value = 1; load() }

const doApprove = async (row) => {
  await ElMessageBox.confirm(`确定审核通过「${row.title}」吗？`, '审核', { type: 'info' })
  await api.put(`/api/admin/recipes/${row.id}/status?status=1`)
  ElMessage.success('已审核通过')
  load(); loadCounts()
}

const doReject = async (row) => {
  await ElMessageBox.confirm(`确定驳回「${row.title}」吗？用户可修改后重新提交。`, '驳回', { type: 'warning' })
  await api.put(`/api/admin/recipes/${row.id}/status?status=2`)
  ElMessage.success('已驳回')
  load(); loadCounts()
}

const doOffline = async (row) => {
  await ElMessageBox.confirm(`确定下架「${row.title}」吗？`, '下架', { type: 'warning' })
  await api.put(`/api/admin/recipes/${row.id}/status?status=0`)
  ElMessage.success('已下架')
  load(); loadCounts()
}

const preview = async (row) => {
  const [detail, videos] = await Promise.all([
    api.get(`/api/admin/recipes/${row.id}`),
    api.get('/api/admin/videos', { params: { recipeId: row.id } })
  ])
  previewData.value = { ...detail, status: row.status }
  previewVideos.value = videos || []
  try {
    const s = typeof detail.steps === 'string' ? JSON.parse(detail.steps) : (detail.steps || [])
    parsedSteps.value = s
  } catch { parsedSteps.value = [] }
  previewVisible.value = true
}

onMounted(() => {
  // default show pending
  search.status = 0
  load()
  loadCounts()
})
</script>

<style scoped>
.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  padding: 8px 0;
}

.stat-card.pending { background: #fdf6ec; border-color: #faecd8; }
.stat-card.passed { background: #f0f9eb; border-color: #e1f3d8; }
.stat-card.rejected { background: #fef0f0; border-color: #fde2e2; }
.stat-num { font-size: 28px; font-weight: 700; }
.stat-card.pending .stat-num { color: #f57f17; }
.stat-card.passed .stat-num { color: #2e7d32; }
.stat-card.rejected .stat-num { color: #c62828; }
.stat-label { font-size: 13px; color: #888; margin-top: 4px; }

/* Preview Dialog — styles copied from RecipesView edit dialog */
.img-row { display: flex; align-items: center; gap: 10px; }
.img-preview { width: 160px; height: 110px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
.img-upload-btn { width: 110px; height: 110px; border: 1.5px dashed #d9d9d9; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #fff; }
.ingredient-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.ingredient-row { display: flex; gap: 8px; align-items: center; }
.step-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.step-row { display: flex; gap: 8px; align-items: center; }
.step-number { width: 32px; height: 32px; border-radius: 50%; background: var(--theme-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0; }
.video-manage { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 600px; margin: 0 auto; }
.video-row { padding: 16px; border: 1px solid #e8e0d8; border-radius: 10px; background: #fdfaf7; display: flex; align-items: flex-start; gap: 12px; }
.video-edit-box { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.video-field { display: flex; flex-direction: column; gap: 4px; }
.video-field label { font-size: 12px; color: #888; font-weight: 500; }
.video-preview-box { width: 100%; border-radius: 8px; overflow: hidden; background: #000; margin: 4px 0; }
.video-thumb { width: 100%; height: 180px; display: block; object-fit: contain; }
</style>

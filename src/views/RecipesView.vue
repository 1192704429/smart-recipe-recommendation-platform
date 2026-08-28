<template>
  <AdminLayout>
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="var(--theme-primary)"><Bowl /></el-icon>
            <span>菜谱管理</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="openAdd">新增菜谱</el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-input v-model="search.keyword" placeholder="搜索菜谱名称" clearable style="width:220px" @keyup.enter="load" />
        <el-select v-model="search.difficulty" placeholder="难度" clearable style="width:110px">
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="load">查询</el-button>
        <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="list" border stripe style="width:100%" empty-text="暂无数据">
      <el-table-column prop="id" label="ID" width="70"><template #default="{row}">{{ String(row.id).padStart(2,'0') }}</template></el-table-column>
      <el-table-column label="封面" width="70"><template #default="{row}"><el-image v-if="row.coverImage" :src="imgUrl(row.coverImage)" style="width:44px;height:44px;border-radius:4px" fit="cover" /><span v-else style="color:#bbb">无</span></template></el-table-column>
      <el-table-column prop="title" label="菜谱名称" min-width="120" />
      <el-table-column prop="difficulty" label="难度" width="80"><template #default="{row}">{{ {easy:'简单',medium:'中等',hard:'困难'}[row.difficulty]||row.difficulty }}</template></el-table-column>
      <el-table-column prop="cookTime" label="时长(分钟)" width="100" />
      <el-table-column prop="favoriteCount" label="收藏量" width="80" />
      <el-table-column prop="viewCount" label="浏览量" width="80" />
      <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.status===1?'success':row.status===2?'danger':'warning'" size="small">{{ row.status===1?'已上架':row.status===2?'已驳回':'待审核' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="150" fixed="right"><template #default="{row}"><el-button type="primary" size="small" @click="openEdit(row)">编辑</el-button><el-button type="danger" size="small" @click="del(row)">删除</el-button></template></el-table-column>
    </el-table>
    <AdminPagination
      v-model:current-page="pageNum"
      :page-size="pageSize"
      :total="total"
      @change="load"
    />

    <el-drawer
      v-model="drawerVisible"
      :title="form.id ? '编辑菜谱' : '新增菜谱'"
      direction="rtl"
      size="600px"
      class="form-drawer"
      destroy-on-close
    >
      <div class="drawer-body">
      <el-form :model="form" label-width="90px">
        <el-form-item label="菜谱名称" required><el-input v-model="form.title" placeholder="请输入菜谱名称" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要描述" /></el-form-item>
        <el-form-item label="封面图"><div class="img-row"><div class="img-preview" v-if="form.coverImage"><el-image :src="imgUrl(form.coverImage)" fit="cover" style="width:100%;height:100%" /></div><el-upload action="http://127.0.0.1:8080/api/admin/upload" :headers="uploadHeaders" :show-file-list="false" accept="image/*" :on-success="(res)=>{if(res.code===200)form.coverImage=res.data;else ElMessage.error(res.message||'上传失败')}" :on-error="()=>ElMessage.error('上传失败')"><div class="img-upload-btn"><el-icon :size="28" color="#bbb"><Plus/></el-icon></div></el-upload></div></el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="烹饪时长"><el-input v-model.number="form.cookTime" inputmode="numeric" style="width:100%"><template #suffix><span style="color:#999;font-size:12px;padding-right:4px">分钟</span></template></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="份量"><el-input v-model.number="form.servings" inputmode="numeric" style="width:100%"><template #suffix><span style="color:#999;font-size:12px;padding-right:4px">克</span></template></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="热量"><el-input v-model.number="form.calories" inputmode="numeric" style="width:100%"><template #suffix><span style="color:#999;font-size:12px;padding-right:4px">卡</span></template></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="难度"><el-select v-model="form.difficulty" style="width:100%"><el-option label="简单" value="easy"/><el-option label="中等" value="medium"/><el-option label="困难" value="hard"/></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="时令"><el-select v-model="form.season" style="width:100%" clearable><el-option label="春" value="spring"/><el-option label="夏" value="summer"/><el-option label="秋" value="autumn"/><el-option label="冬" value="winter"/><el-option label="四季" value="all"/></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="菜系"><el-checkbox-group v-model="form.categoryIds"><el-checkbox v-for="c in allCuisines" :key="c.id" :label="c.name" :value="c.id" /></el-checkbox-group></el-form-item>
        <el-form-item label="适合人群"><el-checkbox-group v-model="crowdTagsArr"><el-checkbox label="儿童" value="儿童" /><el-checkbox label="健身" value="健身" /><el-checkbox label="老人" value="老人" /><el-checkbox label="孕妇" value="孕妇" /><el-checkbox label="素食" value="素食" /></el-checkbox-group></el-form-item>
        <el-form-item label="食材"><div class="ingredient-list"><div v-for="(item,idx) in form.ingredients" :key="idx" class="ingredient-row"><el-select v-model="item.ingredientId" placeholder="选择食材" filterable style="width:180px"><el-option v-for="ing in ingredientOptions" :key="ing.value" :label="ing.label" :value="ing.value"/></el-select><el-input v-model="item.amount" placeholder="用量，如 500g" style="width:140px"/><el-button type="danger" size="small" @click="form.ingredients.splice(idx,1)">删除</el-button></div><el-button size="small" @click="form.ingredients.push({ingredientId:'',amount:'',sort:form.ingredients.length+1})">+ 添加食材</el-button></div></el-form-item>
        <el-form-item label="步骤"><div class="step-list"><div v-for="(step,idx) in parsedSteps" :key="idx" class="step-row"><div class="step-number">{{ idx + 1 }}</div><el-input v-model="step.description" placeholder="请输入步骤描述" style="flex:1"/><el-button type="danger" size="small" @click="parsedSteps.splice(idx,1)">删除</el-button></div><el-button size="small" @click="parsedSteps.push({stepNum:parsedSteps.length+1,description:'',image:''})">+ 添加步骤</el-button></div></el-form-item>
        <el-form-item label="小贴士"><el-input v-model="form.tips" type="textarea" :rows="2" placeholder="烹饪技巧"/></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架"/></el-form-item>
        <el-divider content-position="left"><el-icon style="vertical-align:middle;margin-right:4px"><VideoPlay/></el-icon><span>视频教学</span></el-divider>
        <el-form-item label-width="0"><div class="video-manage"><div v-for="(v,idx) in form.videos" :key="idx" class="video-row"><div class="video-edit-box"><div class="video-field"><label>视频标题</label><el-input v-model="v.title" placeholder="请输入视频标题" size="small"/></div><div class="video-field"><label>视频地址</label><div class="video-url-row"><el-input v-model="v.videoUrl" placeholder="上传后自动填入，或手动粘贴URL" size="small" style="flex:1"/><el-upload action="http://127.0.0.1:8080/api/admin/upload-video" :headers="uploadHeaders" :show-file-list="false" accept="video/*" :before-upload="()=>{v._uploading=true;return true}" :on-success="(res)=>{v._uploading=false;if(res.code===200){v.videoUrl=res.data[0]||res.data;v._videoKey=(v._videoKey||0)+1;ElMessage.success('上传成功')}else ElMessage.error(res.message||'上传失败')}" :on-error="()=>{v._uploading=false;ElMessage.error('上传失败')}"><el-button :loading="v._uploading" type="primary" size="small" style="margin-left:8px">上传视频</el-button></el-upload></div></div><div class="video-preview-box" v-if="v.videoUrl"><video :src="mediaUrl(v.videoUrl)" controls class="video-thumb" :key="v._videoKey" preload="metadata"/></div></div><el-button type="danger" size="small" :icon="Delete" circle style="flex-shrink:0;margin-left:12px;align-self:flex-start;margin-top:22px" @click="removeVideo(idx)"/></div><el-button size="small" @click="addVideo" style="width:100%;margin-top:12px">+ 添加视频</el-button></div></el-form-item>
      </el-form>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible=false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </template>
    </el-drawer>
    </el-card>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, VideoPlay, Bowl, Search, Refresh } from '@element-plus/icons-vue'
import api from '../api'
import AdminLayout from '../components/AdminLayout.vue'
import AdminPagination from '../components/AdminPagination.vue'

const BASE = 'http://127.0.0.1:8080'
const imgUrl = (path) => path?.startsWith('http') ? path : BASE + path
const mediaUrl = (path) => path?.startsWith('http') ? path : BASE + path
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const search = reactive({ keyword: '', difficulty: '' })
const drawerVisible = ref(false)
const saving = ref(false)
const form = reactive(emptyForm())
const parsedSteps = ref([])

// 人群标签数组，与 form.crowdTags 字符串双向同步
const crowdTagsArr = computed({
  get: () => form.crowdTags ? form.crowdTags.split(',').filter(Boolean) : [],
  set: (arr) => { form.crowdTags = arr.join(',') }
})

function emptyForm() {
  return { id: null, title: '', description: '', coverImage: '', cookTime: 30, servings: 2, calories: 0, difficulty: 'easy', season: '', steps: '', tips: '', status: 1, categoryIds: [], crowdTags: '', ingredients: [], videos: [] }
}

function newVideo() {
  return { id: null, title: '', videoUrl: '', coverUrl: '', duration: null, sort: 0, _uploading: false, _videoKey: 0 }
}

const addVideo = () => { form.videos.push(newVideo()) }
const removeVideo = (idx) => { form.videos.splice(idx, 1) }
const allIngredients = ref([])
const ingredientOptions = computed(() => (allIngredients.value || []).map(ing => ({
  ...ing,
  value: String(ing.id),
  label: ing.name + (ing.unit ? ` (${ing.unit})` : '')
})))
const loadIngredients = async () => { allIngredients.value = await api.get('/api/admin/ingredients', { params: { all: true } }) || [] }
const allCuisines = ref([])
const loadCuisines = async () => { const data = await api.get('/api/admin/categories', { params: { type: '菜系', all: true } }); allCuisines.value = data || [] }
const load = async () => {
  const params = { pageNum: pageNum.value, pageSize: pageSize.value }
  if (search.keyword) params.keyword = search.keyword
  if (search.difficulty) params.difficulty = search.difficulty
  const res = await api.get('/api/admin/recipes', { params })
  list.value = res.list || []
  total.value = res.total || 0
}
const resetSearch = () => { search.keyword = ''; search.difficulty = ''; pageNum.value = 1; load() }
const openAdd = () => { Object.assign(form, emptyForm()); parsedSteps.value = []; drawerVisible.value = true }
const openEdit = async (row) => {
  Object.assign(form, emptyForm())
  if (!allIngredients.value.length) await loadIngredients()
  if (!allCuisines.value.length) await loadCuisines()
  const [detail, recipeVideos] = await Promise.all([
    api.get(`/api/admin/recipes/${row.id}`),
    api.get('/api/admin/videos', { params: { recipeId: row.id } })
  ])
  const steps = typeof detail.steps === 'string' ? JSON.parse(detail.steps) : (detail.steps || [])
  Object.assign(form, { ...detail, crowdTags: detail.crowdTags || '', categoryIds: (detail.categories || []).map(c => c.id), ingredients: (detail.ingredients || []).map((ing, i) => ({ ingredientId: ing.ingredientId != null ? String(ing.ingredientId) : '', amount: ing.amount, sort: i + 1 })), videos: (recipeVideos || []).map(v => ({ ...v, _uploading: false, _videoKey: 0 })) })
  parsedSteps.value = steps
  drawerVisible.value = true
}
const save = async () => {
  if (!form.title) { ElMessage.warning('请输入菜谱名称'); return }
  saving.value = true
  try {
    const { videos, ...recipeData } = { ...form }
    const cleanRecipe = Object.fromEntries(Object.entries(recipeData).filter(([k]) => k !== '_uploading'))
    cleanRecipe.steps = JSON.stringify(parsedSteps.value)
    cleanRecipe.ingredients = (cleanRecipe.ingredients || []).map((item, idx) => ({
      ...item,
      ingredientId: item.ingredientId === '' || item.ingredientId == null ? null : Number(item.ingredientId),
      sort: item.sort || idx + 1
    }))
    
    // 人群标签映射到分类ID：儿童->9, 健身->10, 老人->11
    const crowdTagMap = { '儿童': 9, '健身': 10, '老人': 11 }
    const crowdCategoryIds = crowdTagsArr.value.map(tag => crowdTagMap[tag]).filter(Boolean)
    // 合并菜系分类和人群分类
    cleanRecipe.categoryIds = [...new Set([...cleanRecipe.categoryIds, ...crowdCategoryIds])]
    
    const res = await api.post('/api/admin/recipes', cleanRecipe)
    const recipeId = res?.data?.id || form.id
    if (videos && videos.length > 0) {
      for (const v of videos) {
        if (!v.videoUrl) continue
        const { _uploading, _videoKey, ...videoData } = v
        await api.post('/api/admin/videos', { ...videoData, recipeId })
      }
    }
    ElMessage.success('保存成功')
    saving.value = false
    drawerVisible.value = false
    load()
  } catch (e) {
    saving.value = false
    ElMessage.error(e.message || '保存失败')
  }
}
const del = async (row) => {
  await ElMessageBox.confirm(`确定删除菜谱「${row.title}」吗？`, '提示', { type: 'warning' })
  await api.delete(`/api/admin/recipes/${row.id}`)
  ElMessage.success('已删除')
  load()
}
onMounted(() => { load(); loadIngredients(); loadCuisines() })
</script>

<style scoped>
.img-row { display: flex; align-items: center; gap: 10px; }
.img-preview { width: 160px; height: 110px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
.img-upload-btn { width: 110px; height: 110px; border: 1.5px dashed #d9d9d9; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color .2s; background: white; }
.img-upload-btn:hover { border-color: var(--theme-primary); }
.img-upload-btn:hover .el-icon { color: var(--theme-primary) !important; }
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
.video-field-row { display: flex; align-items: center; }
.video-url-row { display: flex; align-items: center; }
.video-preview-box { width: 100%; border-radius: 8px; overflow: hidden; background: #000; margin: 4px 0; }
.video-thumb { width: 100%; height: 180px; display: block; object-fit: contain; }
</style>

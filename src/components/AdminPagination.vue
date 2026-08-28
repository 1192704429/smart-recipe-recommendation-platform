<template>
  <div v-if="total > 0" class="admin-pagination">
    <span class="page-indicator">第 {{ currentPage }} / {{ totalPages }} 页</span>
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      background
      hide-on-single-page
      @update:current-page="onPageChange"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, default: 0 }
})

const emit = defineEmits(['update:currentPage', 'change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const onPageChange = (page) => {
  emit('update:currentPage', page)
  emit('change', page)
}
</script>

<style scoped>
.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-border);
}

.page-indicator {
  font-size: 13px;
  color: var(--theme-text-secondary);
  white-space: nowrap;
}

.admin-pagination :deep(.el-pagination) {
  margin-top: 0;
  justify-content: center;
}

.admin-pagination :deep(.el-pagination.is-background .btn-prev),
.admin-pagination :deep(.el-pagination.is-background .btn-next),
.admin-pagination :deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  font-weight: 500;
}

.admin-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: var(--theme-primary);
}
</style>

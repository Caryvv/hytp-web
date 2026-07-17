<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { listLogs } from '@/api/log'
import type { OperationLog } from '@/types'

const loading = ref(false)
const list = ref<OperationLog[]>([])
const total = ref(0)
const query = reactive({ module: '', page: 1, pageSize: 15 })

function fmtTime(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const data = await listLogs({ module: query.module, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div>
    <h2>操作日志</h2>
    <div class="toolbar">
      <el-select
        v-model="query.module"
        placeholder="全部模块"
        clearable
        style="width: 160px"
        @change="() => { query.page = 1; load() }"
      >
        <el-option label="全部模块" value="" />
        <el-option label="商家" value="shop" />
        <el-option label="商品" value="product" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="adminId" label="管理员" width="90" />
      <el-table-column prop="action" label="动作" width="180" />
      <el-table-column prop="module" label="模块" width="90" />
      <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 12px; justify-content: flex-end"
      layout="total, prev, pager, next"
      :total="total"
      :page-size="query.pageSize"
      :current-page="query.page"
      @current-change="(p: number) => { query.page = p; load() }"
    />
  </div>
</template>

<style scoped>
.toolbar {
  margin-top: 12px;
}
</style>

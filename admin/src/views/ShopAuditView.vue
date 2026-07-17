<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditShop, listShops } from '@/api/audit'
import { SHOP_STATUS_TEXT, SHOP_TYPE_TEXT, type Shop } from '@/types'

const loading = ref(false)
const list = ref<Shop[]>([])
const total = ref(0)
const query = reactive({ status: '' as number | '', page: 1, pageSize: 10 })

function statusTagType(s: number): 'success' | 'info' | 'warning' | 'danger' {
  switch (s) {
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'info'
    default: return 'warning'
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listShops({ status: query.status, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onPass(row: Shop) {
  try {
    await ElMessageBox.confirm(`确认通过商家「${row.name}」的入驻审核？`, '审核通过')
  } catch {
    return
  }
  await auditShop(row.id, true)
  ElMessage.success('已通过')
  load()
}

async function onReject(row: Shop) {
  try {
    const { value } = await ElMessageBox.prompt('请填写驳回理由', '驳回入驻', {
      inputPattern: /\S+/,
      inputErrorMessage: '驳回理由不能为空',
    })
    await auditShop(row.id, false, value)
    ElMessage.success('已驳回')
    load()
  } catch {
    // 取消
  }
}
</script>

<template>
  <div>
    <h2>商家审核</h2>
    <div class="toolbar">
      <el-select
        v-model="query.status"
        placeholder="全部状态"
        clearable
        style="width: 160px"
        @change="() => { query.page = 1; load() }"
      >
        <el-option label="全部状态" value="" />
        <el-option label="待审核" :value="0" />
        <el-option label="正常" :value="1" />
        <el-option label="已驳回" :value="2" />
        <el-option label="已封禁" :value="3" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="店铺名" min-width="140" />
      <el-table-column label="类型" width="110">
        <template #default="{ row }">{{ SHOP_TYPE_TEXT[row.type] }}</template>
      </el-table-column>
      <el-table-column prop="region" label="产区" width="100" />
      <el-table-column label="联系" width="160">
        <template #default="{ row }">{{ row.contactName }} {{ row.contactPhone }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ SHOP_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button link type="success" @click="onPass(row)">通过</el-button>
            <el-button link type="danger" @click="onReject(row)">驳回</el-button>
          </template>
          <span v-else class="muted">—</span>
        </template>
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
.muted {
  color: #c0c4cc;
}
</style>

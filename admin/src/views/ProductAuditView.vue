<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditProduct, listProducts } from '@/api/audit'
import { PRODUCT_STATUS_TEXT, type ProductListItem } from '@/types'

const loading = ref(false)
const list = ref<ProductListItem[]>([])
const total = ref(0)
// 默认看审核中队列
const query = reactive({ status: 2 as number | '', page: 1, pageSize: 10 })

function statusTagType(s: number): 'success' | 'info' | 'warning' | 'danger' {
  switch (s) {
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'danger'
    default: return 'info'
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listProducts({ status: query.status, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onPass(row: ProductListItem) {
  try {
    await ElMessageBox.confirm(`确认通过商品「${row.title}」上架？`, '审核通过')
  } catch {
    return
  }
  await auditProduct(row.id, true)
  ElMessage.success('已通过，商品进入在售')
  load()
}

async function onReject(row: ProductListItem) {
  try {
    const { value } = await ElMessageBox.prompt('请填写驳回理由', '驳回商品', {
      inputPattern: /\S+/,
      inputErrorMessage: '驳回理由不能为空',
    })
    await auditProduct(row.id, false, value)
    ElMessage.success('已驳回')
    load()
  } catch {
    // 取消
  }
}
</script>

<template>
  <div>
    <h2>商品审核</h2>
    <div class="toolbar">
      <el-select
        v-model="query.status"
        placeholder="状态"
        style="width: 160px"
        @change="() => { query.page = 1; load() }"
      >
        <el-option label="审核中" :value="2" />
        <el-option label="在售" :value="1" />
        <el-option label="已下架" :value="0" />
        <el-option label="违规下架" :value="3" />
        <el-option label="全部" value="" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="shopId" label="商家ID" width="90" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ PRODUCT_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <template v-if="row.status === 2">
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

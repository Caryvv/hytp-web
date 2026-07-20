<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { arbitrateDepositClaim, listDepositClaims } from '@/api/depositClaim'
import { DEPOSIT_CLAIM_STATUS_TEXT, type DepositClaim } from '@/types'

const loading = ref(false)
const list = ref<DepositClaim[]>([])
const total = ref(0)
const query = reactive({ status: '' as number | '', page: 1, pageSize: 10 })

function statusTagType(s: number): 'success' | 'info' | 'warning' | 'danger' {
  switch (s) {
    case 1: return 'success'
    case 2: return 'danger'
    default: return 'warning'
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listDepositClaims({ status: query.status, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onApprove(row: DepositClaim) {
  try {
    await ElMessageBox.confirm(
      `确认订单「${row.orderNo}」质量赔付成立？将扣商家保障金 ¥${row.amount} 并扣信用分。`,
      '判定成立',
    )
  } catch {
    return
  }
  await arbitrateDepositClaim(row.id, true, '平台判定质量赔付成立')
  ElMessage.success('已判定成立，赔付执行')
  load()
}

async function onReject(row: DepositClaim) {
  try {
    const { value } = await ElMessageBox.prompt('请填写驳回理由', '驳回索赔', {
      inputPattern: /\S+/,
      inputErrorMessage: '理由不能为空',
    })
    await arbitrateDepositClaim(row.id, false, value)
    ElMessage.success('已驳回')
    load()
  } catch {
    // 取消
  }
}
</script>

<template>
  <div>
    <h2>品质保障金理赔</h2>
    <div class="toolbar">
      <el-select
        v-model="query.status"
        placeholder="全部状态"
        clearable
        style="width: 160px"
        @change="() => { query.page = 1; load() }"
      >
        <el-option label="全部状态" value="" />
        <el-option label="待判定" :value="0" />
        <el-option label="成立赔付" :value="1" />
        <el-option label="已驳回" :value="2" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="orderNo" label="订单号" min-width="170" />
      <el-table-column prop="shopName" label="店铺" min-width="120" />
      <el-table-column prop="reason" label="索赔原因" min-width="150" />
      <el-table-column label="索赔金额" width="100">
        <template #default="{ row }">¥{{ row.amount }}</template>
      </el-table-column>
      <el-table-column label="商家保障金" width="110">
        <template #default="{ row }">¥{{ row.shopDeposit ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ DEPOSIT_CLAIM_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="判定" width="160">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button link type="success" @click="onApprove(row)">成立</el-button>
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

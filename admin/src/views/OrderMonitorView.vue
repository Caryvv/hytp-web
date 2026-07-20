<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { arbitrateRefund, listOrders, listRefunds } from '@/api/order'
import {
  ORDER_STATUS_TEXT,
  REFUND_STATUS_TEXT,
  type Order,
  type Refund,
} from '@/types'

const activeTab = ref<'orders' | 'refunds'>('orders')

// ---- 订单监控 ----
const loading = ref(false)
const list = ref<Order[]>([])
const total = ref(0)
const query = reactive({ keyword: '', status: '' as number | '', page: 1, pageSize: 10 })

function orderTagType(status: number): 'success' | 'info' | 'warning' | 'danger' | 'primary' {
  switch (status) {
    case 1: return 'warning'
    case 2: return 'primary'
    case 4: return 'success'
    case 5: return 'info'
    case 6: return 'danger'
    default: return 'info'
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listOrders({
      keyword: query.keyword,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ---- 售后仲裁 ----
const refundLoading = ref(false)
const refundList = ref<Refund[]>([])
const refundTotal = ref(0)
const refundQuery = reactive({ status: '' as number | '', page: 1, pageSize: 10 })

function refundTagType(status: number): 'success' | 'info' | 'warning' | 'danger' {
  switch (status) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'success'
    default: return 'info'
  }
}

async function loadRefunds() {
  refundLoading.value = true
  try {
    const data = await listRefunds({ status: refundQuery.status, page: refundQuery.page, pageSize: refundQuery.pageSize })
    refundList.value = data.list
    refundTotal.value = data.pagination.total
  } finally {
    refundLoading.value = false
  }
}

async function onArbitrateAgree(row: Refund) {
  try {
    await ElMessageBox.confirm(`平台仲裁：确认同意订单「${row.orderNo}」退款？将强制退款并覆盖商家处理。`, '仲裁-同意退款')
  } catch {
    return
  }
  await arbitrateRefund(row.id, true, '平台判定退款成立')
  ElMessage.success('已仲裁：同意退款')
  loadRefunds()
}

async function onArbitrateReject(row: Refund) {
  try {
    const { value } = await ElMessageBox.prompt('请填写驳回理由', '仲裁-驳回', {
      inputPattern: /\S+/,
      inputErrorMessage: '理由不能为空',
    })
    await arbitrateRefund(row.id, false, value)
    ElMessage.success('已仲裁：驳回')
    loadRefunds()
  } catch {
    // 取消
  }
}

function onTabChange(name: string) {
  if (name === 'refunds') loadRefunds()
  else load()
}
</script>

<template>
  <div>
    <h2>订单监控</h2>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- 订单监控 -->
      <el-tab-pane label="全平台订单" name="orders">
        <div class="toolbar">
          <el-input
            v-model="query.keyword"
            placeholder="按订单号搜索"
            clearable
            style="width: 220px"
            @keyup.enter="() => { query.page = 1; load() }"
            @clear="() => { query.page = 1; load() }"
          />
          <el-select
            v-model="query.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="() => { query.page = 1; load() }"
          >
            <el-option label="全部状态" value="" />
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="已完成" :value="4" />
            <el-option label="已取消" :value="5" />
            <el-option label="售后中" :value="6" />
          </el-select>
          <el-button type="primary" @click="() => { query.page = 1; load() }">搜索</el-button>
        </div>

        <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column prop="shopName" label="店铺" min-width="120" />
          <el-table-column prop="payAmount" label="实付" width="100">
            <template #default="{ row }">¥{{ row.payAmount }}</template>
          </el-table-column>
          <el-table-column label="佣金" width="90">
            <template #default="{ row }">¥{{ row.commission || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="orderTagType(row.status)">{{ ORDER_STATUS_TEXT[row.status] }}</el-tag>
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
      </el-tab-pane>

      <!-- 售后仲裁 -->
      <el-tab-pane label="售后仲裁" name="refunds">
        <div class="toolbar">
          <el-select
            v-model="refundQuery.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
            @change="() => { refundQuery.page = 1; loadRefunds() }"
          >
            <el-option label="全部状态" value="" />
            <el-option label="申请中" :value="0" />
            <el-option label="已同意" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已完成" :value="3" />
          </el-select>
        </div>

        <el-table v-loading="refundLoading" :data="refundList" border style="margin-top: 12px">
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column prop="shopName" label="店铺" min-width="120" />
          <el-table-column prop="reason" label="退款原因" min-width="140" />
          <el-table-column prop="amount" label="金额" width="90">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="refundTagType(row.status)">{{ REFUND_STATUS_TEXT[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="仲裁" width="160">
            <template #default="{ row }">
              <template v-if="row.status !== 3">
                <el-button link type="success" @click="onArbitrateAgree(row)">同意退款</el-button>
                <el-button link type="danger" @click="onArbitrateReject(row)">驳回</el-button>
              </template>
              <span v-else class="muted">已完成</span>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          style="margin-top: 12px; justify-content: flex-end"
          layout="total, prev, pager, next"
          :total="refundTotal"
          :page-size="refundQuery.pageSize"
          :current-page="refundQuery.page"
          @current-change="(p: number) => { refundQuery.page = p; loadRefunds() }"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.muted {
  color: #c0c4cc;
}
</style>

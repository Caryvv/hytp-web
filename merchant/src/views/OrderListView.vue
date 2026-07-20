<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleRefund, listOrders, listRefunds, shipOrder } from '@/api/order'
import {
  ORDER_STATUS_TEXT,
  REFUND_STATUS_TEXT,
  type Order,
  type Refund,
} from '@/types'

const activeTab = ref<'orders' | 'refunds'>('orders')

// ---- 订单列表 ----
const loading = ref(false)
const list = ref<Order[]>([])
const total = ref(0)
const query = reactive({ status: '' as number | '', page: 1, pageSize: 10 })

function orderTagType(status: number): 'success' | 'info' | 'warning' | 'danger' | 'primary' {
  switch (status) {
    case 1: return 'warning'   // 待发货
    case 2: return 'primary'   // 待收货
    case 4: return 'success'   // 已完成
    case 5: return 'info'      // 已取消
    case 6: return 'danger'    // 售后
    default: return 'info'
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listOrders({ status: query.status, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}

// ---- 发货弹窗 ----
const shipVisible = ref(false)
const shipping = ref(false)
const shipOrderNo = ref('')
const shipForm = reactive({ expressCompany: '', expressNo: '' })

function openShip(row: Order) {
  shipOrderNo.value = row.orderNo
  shipForm.expressCompany = ''
  shipForm.expressNo = ''
  shipVisible.value = true
}

async function submitShip() {
  if (!shipForm.expressCompany || !shipForm.expressNo) {
    ElMessage.warning('请填写物流公司和单号')
    return
  }
  shipping.value = true
  try {
    await shipOrder(shipOrderNo.value, { ...shipForm })
    ElMessage.success('发货成功')
    shipVisible.value = false
    load()
  } finally {
    shipping.value = false
  }
}

// ---- 售后列表 ----
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

async function onAgreeRefund(row: Refund) {
  try {
    await ElMessageBox.confirm(`确认同意订单「${row.orderNo}」的退款申请？退款后不可撤销。`, '同意退款')
  } catch {
    return
  }
  await handleRefund(row.id, { agree: true, remark: '商家同意退款' })
  ElMessage.success('已同意退款')
  loadRefunds()
}

async function onRejectRefund(row: Refund) {
  try {
    const { value } = await ElMessageBox.prompt('请填写拒绝理由', '拒绝售后', {
      inputPattern: /\S+/,
      inputErrorMessage: '理由不能为空',
    })
    await handleRefund(row.id, { agree: false, remark: value })
    ElMessage.success('已拒绝')
    loadRefunds()
  } catch {
    // 取消
  }
}

function onTabChange(name: string) {
  if (name === 'refunds') loadRefunds()
  else load()
}

onMounted(load)
</script>

<template>
  <div>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- 订单 -->
      <el-tab-pane label="订单" name="orders">
        <div class="toolbar">
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
        </div>

        <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              <div v-for="it in row.items" :key="it.id">{{ it.title }} ×{{ it.qty }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="payAmount" label="实付" width="100">
            <template #default="{ row }">¥{{ row.payAmount }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="orderTagType(row.status)">{{ ORDER_STATUS_TEXT[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" link type="primary" @click="openShip(row)">发货</el-button>
              <span v-else>—</span>
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

      <!-- 售后 -->
      <el-tab-pane label="售后" name="refunds">
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
          <el-table-column prop="reason" label="退款原因" min-width="160" />
          <el-table-column prop="amount" label="退款金额" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="refundTagType(row.status)">{{ REFUND_STATUS_TEXT[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <template v-if="row.status === 0">
                <el-button link type="success" @click="onAgreeRefund(row)">同意</el-button>
                <el-button link type="danger" @click="onRejectRefund(row)">拒绝</el-button>
              </template>
              <span v-else>—</span>
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

    <!-- 发货弹窗 -->
    <el-dialog v-model="shipVisible" title="发货" width="440px">
      <el-form label-width="90px">
        <el-form-item label="物流公司" required>
          <el-input v-model="shipForm.expressCompany" placeholder="如 顺丰速运" />
        </el-form-item>
        <el-form-item label="物流单号" required>
          <el-input v-model="shipForm.expressNo" placeholder="如 SF1234567890" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="submitShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
}
</style>

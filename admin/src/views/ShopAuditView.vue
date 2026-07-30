<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditShop, listShops } from '@/api/audit'
import { getCreditLogs, penalizeShop } from '@/api/penalty'
import { PERM, SHOP_STATUS_TEXT, SHOP_TYPE_TEXT, type CreditLog, type Shop } from '@/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const list = ref<Shop[]>([])
const total = ref(0)
const query = reactive({ status: '' as number | '', page: 1, pageSize: 10 })

// 信用流水抽屉
const logDrawer = ref(false)
const logLoading = ref(false)
const logShop = ref<Shop | null>(null)
const logs = ref<CreditLog[]>([])

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

const canPenalize = () => auth.hasPermission(PERM.SHOP_PENALTY)

async function onDeduct(row: Shop) {
  try {
    const { value: points } = await ElMessageBox.prompt('扣除信用分（正整数）', `扣分：${row.name}`, {
      inputPattern: /^[1-9]\d*$/,
      inputErrorMessage: '请输入大于 0 的整数',
    })
    const { value: reason } = await ElMessageBox.prompt('扣分理由', `扣分：${row.name}`, {
      inputPattern: /\S+/,
      inputErrorMessage: '理由不能为空',
    })
    await penalizeShop(row.id, { action: 'deduct', points: Number(points), reason })
    ElMessage.success('已扣分')
    load()
  } catch {
    // 取消
  }
}

async function onBan(row: Shop) {
  try {
    const { value: reason } = await ElMessageBox.prompt('封禁理由', `封禁：${row.name}`, {
      inputPattern: /\S+/,
      inputErrorMessage: '封禁理由不能为空',
    })
    await penalizeShop(row.id, { action: 'ban', reason })
    ElMessage.success('已封禁')
    load()
  } catch {
    // 取消
  }
}

async function onUnban(row: Shop) {
  try {
    await ElMessageBox.confirm(`确认解封商家「${row.name}」？`, '解封')
  } catch {
    return
  }
  await penalizeShop(row.id, { action: 'unban' })
  ElMessage.success('已解封')
  load()
}

async function openLogs(row: Shop) {
  logShop.value = row
  logDrawer.value = true
  logLoading.value = true
  try {
    const data = await getCreditLogs(row.id, { pageSize: 50 })
    logs.value = data.list
  } finally {
    logLoading.value = false
  }
}

function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('zh-CN')
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
      <el-table-column prop="creditScore" label="信用分" width="80" />
      <el-table-column label="操作" min-width="260">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button link type="success" @click="onPass(row)">通过</el-button>
            <el-button link type="danger" @click="onReject(row)">驳回</el-button>
          </template>
          <template v-if="canPenalize()">
            <el-button link type="warning" @click="onDeduct(row)">扣分</el-button>
            <el-button v-if="row.status === 3" link type="success" @click="onUnban(row)">解封</el-button>
            <el-button v-else link type="danger" @click="onBan(row)">封禁</el-button>
            <el-button link type="primary" @click="openLogs(row)">信用记录</el-button>
          </template>
          <span v-if="row.status !== 0 && !canPenalize()" class="muted">—</span>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="logDrawer" :title="`信用记录：${logShop?.name ?? ''}`" size="480px">
      <el-table v-loading="logLoading" :data="logs" border>
        <el-table-column label="变动" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.change < 0 ? '#f56c6c' : row.change > 0 ? '#67c23a' : '#909399' }">
              {{ row.change > 0 ? '+' : '' }}{{ row.change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="理由" min-width="160" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!logLoading && logs.length === 0" description="暂无信用记录" />
    </el-drawer>

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

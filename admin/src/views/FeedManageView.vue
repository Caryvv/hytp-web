<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listFeeds, setFeedStatus } from '@/api/audit'
import { FEED_STATUS_TEXT, type FeedListItem } from '@/types'

const loading = ref(false)
const list = ref<FeedListItem[]>([])
const total = ref(0)
// 先发后审：默认巡查正常动态
const query = reactive({ status: 1 as number | '', page: 1, pageSize: 10 })

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
    const data = await listFeeds({ status: query.status, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onOff(row: FeedListItem) {
  try {
    const { value } = await ElMessageBox.prompt('请填写下架理由', '下架动态', {
      inputPattern: /\S+/,
      inputErrorMessage: '下架理由不能为空',
    })
    await setFeedStatus(row.id, true, value)
    ElMessage.success('已下架')
    load()
  } catch {
    // 取消
  }
}

async function onRestore(row: FeedListItem) {
  try {
    await ElMessageBox.confirm('确认恢复该动态？恢复后重新对用户可见。', '恢复动态')
  } catch {
    return
  }
  await setFeedStatus(row.id, false)
  ElMessage.success('已恢复')
  load()
}
</script>

<template>
  <div>
    <h2>动态巡查</h2>
    <div class="toolbar">
      <el-select
        v-model="query.status"
        placeholder="状态"
        style="width: 160px"
        @change="() => { query.page = 1; load() }"
      >
        <el-option label="正常" :value="1" />
        <el-option label="已下架" :value="2" />
        <el-option label="待审核" :value="0" />
        <el-option label="全部" value="" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="作者" width="130">
        <template #default="{ row }">{{ row.author?.nickname || `用户${row.userId}` }}</template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
      <el-table-column label="互动" width="140">
        <template #default="{ row }">
          <span class="muted">赞{{ row.likeCount }} · 评{{ row.commentCount }} · 藏{{ row.favoriteCount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ FEED_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下架理由" min-width="140">
        <template #default="{ row }">
          <span v-if="row.offReason" class="reason">{{ row.offReason }}</span>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button v-if="row.status === 1" link type="danger" @click="onOff(row)">下架</el-button>
          <el-button v-else-if="row.status === 2" link type="success" @click="onRestore(row)">恢复</el-button>
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
.reason {
  color: #f56c6c;
}
</style>

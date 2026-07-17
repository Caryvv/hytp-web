<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getDashboard } from '@/api/dashboard'
import type { DashboardData } from '@/types'

const data = ref<DashboardData | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await getDashboard()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading">
    <h2>概览</h2>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <div class="stat-label">商家总数</div>
          <div class="stat-value">{{ data?.shop.total ?? '—' }}</div>
          <div class="stat-sub">
            待审核 <b class="warn">{{ data?.shop.pending ?? 0 }}</b> · 正常 {{ data?.shop.active ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="stat-label">商品总数</div>
          <div class="stat-value">{{ data?.product.total ?? '—' }}</div>
          <div class="stat-sub">
            待审核 <b class="warn">{{ data?.product.auditing ?? 0 }}</b> · 在售 {{ data?.product.onSale ?? 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="stat-label">待办</div>
          <div class="stat-value">
            {{ (data?.shop.pending ?? 0) + (data?.product.auditing ?? 0) }}
          </div>
          <div class="stat-sub">待审核商家 + 待审核商品</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-label {
  color: #909399;
  font-size: 13px;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin: 8px 0;
}
.stat-sub {
  color: #606266;
  font-size: 13px;
}
.warn {
  color: #e6a23c;
}
</style>

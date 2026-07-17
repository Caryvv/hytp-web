<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { SHOP_STATUS_TEXT } from '@/types'

const auth = useAuthStore()

const tips = computed(() => {
  const s = auth.shop?.status
  if (s === 0) return '店铺资料审核中，通过后即可上架商品。'
  if (s === 2) return `入驻被驳回：${auth.shop?.auditRemark || '请修改资料后重新提交'}。`
  if (s === 3) return '店铺已被封禁，请联系平台。'
  return '店铺状态正常，可正常上架与管理商品。'
})
</script>

<template>
  <div>
    <h2>工作台</h2>
    <el-alert :title="tips" type="info" :closable="false" show-icon style="margin-bottom: 16px" />

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card>
          <div class="stat-label">店铺状态</div>
          <div class="stat-value">{{ auth.shop ? SHOP_STATUS_TEXT[auth.shop.status] : '—' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">信用分</div>
          <div class="stat-value">{{ auth.shop?.creditScore ?? '—' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">保障金余额</div>
          <div class="stat-value">¥{{ auth.shop?.deposit ?? '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">产区</div>
          <div class="stat-value">{{ auth.shop?.region || '—' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 16px">
      <template #header>数据驾驶舱</template>
      <el-empty description="销量/画像/评论关键词等数据分析将在后续阶段接入" />
    </el-card>
  </div>
</template>

<style scoped>
.stat-label {
  color: #909399;
  font-size: 13px;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-top: 8px;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { SHOP_STATUS_TEXT } from '@/types'
import { getReviewStats, type ReviewStats } from '@/api/dashboard'

const auth = useAuthStore()

const tips = computed(() => {
  const s = auth.shop?.status
  if (s === 0) return '店铺资料审核中，通过后即可上架商品。'
  if (s === 2) return `入驻被驳回：${auth.shop?.auditRemark || '请修改资料后重新提交'}。`
  if (s === 3) return '店铺已被封禁，请联系平台。'
  return '店铺状态正常，可正常上架与管理商品。'
})

// ── 评价洞察（情感分布 + 高频品控关键词） ──
const stats = ref<ReviewStats | null>(null)
const statsLoading = ref(false)

const positiveRate = computed(() => {
  if (!stats.value || stats.value.total === 0) return 0
  return Math.round((stats.value.sentiment.positive / stats.value.total) * 100)
})
// 关键词标签大小按词频映射（14~22px），突出高频品控词
const maxCount = computed(() => stats.value?.keywords[0]?.count ?? 1)
function wordSize(count: number): string {
  const size = 14 + Math.round((count / maxCount.value) * 8)
  return `${size}px`
}

onMounted(async () => {
  statsLoading.value = true
  try {
    stats.value = await getReviewStats()
  } finally {
    statsLoading.value = false
  }
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

    <el-card v-loading="statsLoading" style="margin-top: 16px">
      <template #header>评价洞察（AI 情感分析）</template>
      <el-empty v-if="stats && stats.total === 0" description="暂无带情感分析的评价，用户评价后自动生成" />
      <template v-else-if="stats">
        <div class="section-title">情感分布 · 共 {{ stats.total }} 条</div>
        <div class="sentiment-bar">
          <div class="seg positive" :style="{ flex: stats.sentiment.positive || 0.001 }" />
          <div class="seg neutral" :style="{ flex: stats.sentiment.neutral || 0.001 }" />
          <div class="seg negative" :style="{ flex: stats.sentiment.negative || 0.001 }" />
        </div>
        <div class="sentiment-legend">
          <span><i class="dot positive" />好评 {{ stats.sentiment.positive }}（{{ positiveRate }}%）</span>
          <span><i class="dot neutral" />中评 {{ stats.sentiment.neutral }}</span>
          <span><i class="dot negative" />差评 {{ stats.sentiment.negative }}</span>
        </div>

        <div class="section-title" style="margin-top: 20px">高频品控关键词</div>
        <div v-if="stats.keywords.length" class="keywords">
          <el-tag
            v-for="kw in stats.keywords"
            :key="kw.word"
            :style="{ fontSize: wordSize(kw.count) }"
            type="info"
            effect="plain"
          >{{ kw.word }} · {{ kw.count }}</el-tag>
        </div>
        <span v-else class="muted">暂无关键词</span>
      </template>
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
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}
.sentiment-bar {
  display: flex;
  height: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f2f5;
}
.sentiment-bar .seg.positive {
  background: #67c23a;
}
.sentiment-bar .seg.neutral {
  background: #e6a23c;
}
.sentiment-bar .seg.negative {
  background: #f56c6c;
}
.sentiment-legend {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}
.sentiment-legend .dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 5px;
}
.sentiment-legend .dot.positive {
  background: #67c23a;
}
.sentiment-legend .dot.neutral {
  background: #e6a23c;
}
.sentiment-legend .dot.negative {
  background: #f56c6c;
}
.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.muted {
  color: #909399;
  font-size: 13px;
}
</style>

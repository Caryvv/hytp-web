<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteConfig, listConfigs, saveConfig } from '@/api/config'
import type { SysConfigItem } from '@/types'

const loading = ref(false)
const list = ref<SysConfigItem[]>([])

async function load() {
  loading.value = true
  try {
    const data = await listConfigs()
    list.value = data.list
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onEdit(row: SysConfigItem) {
  const hint = row.type === 'rate' ? '（0~1 之间的小数，如 0.06）' : ''
  try {
    const { value } = await ElMessageBox.prompt(
      `${row.desc || row.key}${hint}`,
      `编辑：${row.label}`,
      { inputValue: row.value ?? '', inputPattern: /.*/ },
    )
    await saveConfig(row.key, value ?? '')
    ElMessage.success('已保存')
    load()
  } catch {
    // 取消
  }
}

async function onCreate() {
  try {
    const { value: key } = await ElMessageBox.prompt('配置键（如 trade.commission_rate）', '新增配置', {
      inputPattern: /\S+/,
      inputErrorMessage: '配置键不能为空',
    })
    const { value: val } = await ElMessageBox.prompt(`「${key}」的值`, '新增配置', { inputPattern: /.*/ })
    await saveConfig(key, val ?? '')
    ElMessage.success('已新增')
    load()
  } catch {
    // 取消
  }
}

async function onDelete(row: SysConfigItem) {
  const tip = row.type !== 'string' || row.desc
    ? `删除「${row.label}」后将回落到系统默认值，确认？`
    : `确认删除配置「${row.key}」？`
  try {
    await ElMessageBox.confirm(tip, '删除配置', { type: 'warning' })
  } catch {
    return
  }
  await deleteConfig(row.key)
  ElMessage.success('已删除')
  load()
}
</script>

<template>
  <div>
    <h2>平台配置</h2>
    <div class="toolbar">
      <el-button type="primary" @click="onCreate">新增配置</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column label="名称" min-width="140">
        <template #default="{ row }">
          {{ row.label }}
          <el-tag v-if="!row.persisted" size="small" type="info" style="margin-left: 6px">默认值</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="key" label="键" min-width="180" />
      <el-table-column prop="value" label="当前值" width="140" />
      <el-table-column prop="desc" label="说明" min-width="220">
        <template #default="{ row }"><span class="muted">{{ row.desc || '—' }}</span></template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
          <el-button v-if="row.persisted" link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.toolbar {
  margin-top: 12px;
}
.muted {
  color: #909399;
}
</style>

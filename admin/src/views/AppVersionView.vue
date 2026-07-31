<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAppVersion,
  deleteAppVersion,
  listAppVersions,
  toggleAppVersion,
  updateAppVersion,
  uploadApk,
} from '@/api/appVersion'
import type { AppVersion } from '@/types'

const loading = ref(false)
const list = ref<AppVersion[]>([])

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const uploading = ref(false)
const uploadPercent = ref(0)

const form = reactive({
  platform: 'android',
  versionCode: 0,
  versionName: '',
  updateLog: '',
  downloadUrl: '',
  forceUpdate: false,
  minSupportedCode: 0,
  enabled: true,
})

async function load() {
  loading.value = true
  try {
    list.value = (await listAppVersions()).list
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    platform: 'android', versionCode: 0, versionName: '', updateLog: '',
    downloadUrl: '', forceUpdate: false, minSupportedCode: 0, enabled: true,
  })
  uploadPercent.value = 0
  dialogVisible.value = true
}

function openEdit(row: AppVersion) {
  editingId.value = row.id
  Object.assign(form, {
    platform: row.platform, versionCode: row.versionCode, versionName: row.versionName,
    updateLog: row.updateLog, downloadUrl: row.downloadUrl, forceUpdate: row.forceUpdate,
    minSupportedCode: row.minSupportedCode, enabled: row.enabled,
  })
  uploadPercent.value = 0
  dialogVisible.value = true
}

async function onPickApk(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.apk')) {
    ElMessage.error('请选择 .apk 文件')
    return
  }
  uploading.value = true
  uploadPercent.value = 0
  try {
    const r = await uploadApk(file, (p) => { uploadPercent.value = p })
    form.downloadUrl = r.url
    ElMessage.success(`上传完成（${(r.size / 1024 / 1024).toFixed(1)} MB）`)
  } catch {
    ElMessage.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

async function onSubmit() {
  if (!form.versionCode || !form.versionName) {
    ElMessage.error('请填写版本号和版本名')
    return
  }
  if (!form.downloadUrl) {
    ElMessage.error('请先上传 APK 或填写下载地址')
    return
  }
  if (editingId.value === null) {
    await createAppVersion({ ...form })
    ElMessage.success('已新增版本')
  } else {
    await updateAppVersion(editingId.value, { ...form })
    ElMessage.success('已更新')
  }
  dialogVisible.value = false
  load()
}

async function onToggle(row: AppVersion) {
  await toggleAppVersion(row.id, !row.enabled)
  ElMessage.success(row.enabled ? '已下线' : '已上线')
  load()
}

async function onDelete(row: AppVersion) {
  try {
    await ElMessageBox.confirm(`确认删除版本 ${row.versionName}(${row.versionCode})？`, '删除', { type: 'warning' })
  } catch {
    return
  }
  await deleteAppVersion(row.id)
  ElMessage.success('已删除')
  load()
}
</script>

<template>
  <div>
    <h2>版本管理</h2>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增版本</el-button>
      <span class="hint">发新版：上传 APK → 填版本号/说明 → 保存。App 启动即检查更新。</span>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="versionCode" label="版本号" width="80" />
      <el-table-column prop="versionName" label="版本名" width="100" />
      <el-table-column prop="updateLog" label="更新说明" min-width="200" show-overflow-tooltip />
      <el-table-column label="下载地址" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <a :href="row.downloadUrl" target="_blank" class="link">{{ row.downloadUrl || '—' }}</a>
        </template>
      </el-table-column>
      <el-table-column label="强制" width="70">
        <template #default="{ row }">
          <el-tag v-if="row.forceUpdate" type="danger" size="small">强制</el-tag>
          <span v-else class="muted">否</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '在线' : '下线' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link :type="row.enabled ? 'warning' : 'success'" @click="onToggle(row)">
            {{ row.enabled ? '下线' : '上线' }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId === null ? '新增版本' : '编辑版本'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="APK 文件">
          <input type="file" accept=".apk" :disabled="uploading" @change="onPickApk" />
          <el-progress v-if="uploading || uploadPercent > 0" :percentage="uploadPercent" style="width: 100%; margin-top: 6px" />
        </el-form-item>
        <el-form-item label="下载地址">
          <el-input v-model="form.downloadUrl" placeholder="上传后自动填充，也可手填" />
        </el-form-item>
        <el-form-item label="版本号" required>
          <el-input-number v-model="form.versionCode" :min="1" />
          <span class="hint">递增整数，须大于当前线上版本</span>
        </el-form-item>
        <el-form-item label="版本名" required>
          <el-input v-model="form.versionName" placeholder="如 2.0.0" style="width: 200px" />
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input v-model="form.updateLog" type="textarea" :rows="3" placeholder="本次更新内容" />
        </el-form-item>
        <el-form-item label="最低支持">
          <el-input-number v-model="form.minSupportedCode" :min="0" />
          <span class="hint">低于此版本号强制升级，0=不限制</span>
        </el-form-item>
        <el-form-item label="强制更新">
          <el-switch v-model="form.forceUpdate" />
        </el-form-item>
        <el-form-item label="立即上线">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="uploading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.hint {
  color: #909399;
  font-size: 12px;
}
.muted {
  color: #c0c4cc;
}
.link {
  color: var(--el-color-primary);
  text-decoration: none;
}
</style>


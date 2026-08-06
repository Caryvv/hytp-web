<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createContent, deleteContent, listContents, toggleContent, updateContent } from '@/api/content'
import { uploadImageToOss } from '@/api/upload'
import { CONTENT_STATUS_TEXT, CONTENT_TYPE_TEXT, type Content } from '@/types'

const loading = ref(false)
const list = ref<Content[]>([])
const total = ref(0)
const query = reactive({ type: '' as number | '', status: '' as number | '', page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
// 图集图片 URL 列表（OSS 直传后回填）
const images = ref<string[]>([])
const uploading = ref(false)

const form = reactive({
  type: 1,
  title: '',
  cover: '',
  detail: '',
  city: '',
  category: '',
  status: 1,
})

async function load() {
  loading.value = true
  try {
    const data = await listContents({ type: query.type, status: query.status, page: query.page, pageSize: query.pageSize })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  editingId.value = null
  Object.assign(form, { type: 1, title: '', cover: '', detail: '', city: '', category: '', status: 1 })
  images.value = []
  dialogVisible.value = true
}

function openEdit(row: Content) {
  editingId.value = row.id
  Object.assign(form, {
    type: row.type, title: row.title, cover: row.cover, detail: row.detail,
    city: row.city, category: row.category, status: row.status,
  })
  images.value = [...(row.images || [])]
  dialogVisible.value = true
}

/** 选图后 OSS 直传，成功回填 URL。target: cover=封面 / gallery=图集追加。 */
async function onPickImage(e: Event, target: 'cover' | 'gallery') {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = '' // 允许重复选同一文件
  if (!file) return
  uploading.value = true
  try {
    const url = await uploadImageToOss(file)
    if (target === 'cover') form.cover = url
    else images.value.push(url)
    ElMessage.success('上传成功')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '上传失败')
  } finally {
    uploading.value = false
  }
}

function removeImage(i: number) {
  images.value.splice(i, 1)
}

async function onSubmit() {
  if (!form.title.trim()) {
    ElMessage.error('请填写标题')
    return
  }
  const payload = { ...form, images: images.value }
  if (editingId.value === null) {
    await createContent(payload)
    ElMessage.success('已新增内容')
  } else {
    await updateContent(editingId.value, payload)
    ElMessage.success('已更新')
  }
  dialogVisible.value = false
  load()
}

async function onToggle(row: Content) {
  await toggleContent(row.id)
  ElMessage.success(row.status === 1 ? '已下线' : '已上线')
  load()
}

async function onDelete(row: Content) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？连带清除其点赞/收藏/报名记录。`, '删除', { type: 'warning' })
  } catch {
    return
  }
  await deleteContent(row.id)
  ElMessage.success('已删除')
  load()
}
</script>

<template>
  <div>
    <h2>文旅文化管理</h2>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增内容</el-button>
      <el-select v-model="query.type" placeholder="类型" style="width: 130px" @change="() => { query.page = 1; load() }">
        <el-option label="全部类型" value="" />
        <el-option label="文旅" :value="1" />
        <el-option label="文化传承" :value="2" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" style="width: 130px" @change="() => { query.page = 1; load() }">
        <el-option label="全部状态" value="" />
        <el-option label="已上线" :value="1" />
        <el-option label="已下线" :value="0" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ CONTENT_TYPE_TEXT[row.type] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="city" label="地点" width="100" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column label="互动" width="160">
        <template #default="{ row }">
          <span class="muted">赞{{ row.likeCount }} · 藏{{ row.favoriteCount }} · 报名{{ row.signupCount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ CONTENT_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="onToggle(row)">
            {{ row.status === 1 ? '下线' : '上线' }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId === null ? '新增内容' : '编辑内容'" width="620px">
      <el-form label-width="80px">
        <el-form-item label="类型" required>
          <el-radio-group v-model="form.type">
            <el-radio :value="1">文旅</el-radio>
            <el-radio :value="2">文化传承</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如 西塘汉服文化周" />
        </el-form-item>
        <el-form-item label="封面图">
          <div class="uploader">
            <img v-if="form.cover" :src="form.cover" class="cover-preview" />
            <label class="pick-btn">
              {{ form.cover ? '更换封面' : '上传封面' }}
              <input type="file" accept="image/*" :disabled="uploading" hidden @change="(e) => onPickImage(e, 'cover')" />
            </label>
          </div>
        </el-form-item>
        <el-form-item label="图集">
          <div class="gallery">
            <div v-for="(img, i) in images" :key="i" class="thumb">
              <img :src="img" />
              <span class="remove" @click="removeImage(i)">×</span>
            </div>
            <label class="pick-btn">
              添加图片
              <input type="file" accept="image/*" :disabled="uploading" hidden @change="(e) => onPickImage(e, 'gallery')" />
            </label>
          </div>
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.city" placeholder="如 杭州" style="width: 200px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如 节庆 / 非遗" style="width: 200px" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.detail" type="textarea" :rows="6" placeholder="图文正文内容" />
        </el-form-item>
        <el-form-item label="立即上线">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
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
.muted {
  color: #c0c4cc;
}
.uploader {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cover-preview {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.thumb {
  position: relative;
  width: 72px;
  height: 72px;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
.thumb .remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  line-height: 16px;
  text-align: center;
  background: #f56c6c;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
}
.pick-btn {
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  height: 32px;
  border: 1px dashed var(--el-color-primary);
  color: var(--el-color-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
</style>

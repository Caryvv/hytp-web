<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createContent, deleteContent, listContents, toggleContent, updateContent } from '@/api/content'
import { CONTENT_STATUS_TEXT, CONTENT_TYPE_TEXT, type Content } from '@/types'

const loading = ref(false)
const list = ref<Content[]>([])
const total = ref(0)
const query = reactive({ type: '' as number | '', status: '' as number | '', page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
// 图集：换行分隔的多行文本，提交时拆成数组
const imagesText = ref('')

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
  imagesText.value = ''
  dialogVisible.value = true
}

function openEdit(row: Content) {
  editingId.value = row.id
  Object.assign(form, {
    type: row.type, title: row.title, cover: row.cover, detail: row.detail,
    city: row.city, category: row.category, status: row.status,
  })
  imagesText.value = (row.images || []).join('\n')
  dialogVisible.value = true
}

async function onSubmit() {
  if (!form.title.trim()) {
    ElMessage.error('请填写标题')
    return
  }
  const images = imagesText.value.split('\n').map((s) => s.trim()).filter(Boolean)
  const payload = { ...form, images }
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
          <el-input v-model="form.cover" placeholder="封面图 URL" />
        </el-form-item>
        <el-form-item label="图集">
          <el-input v-model="imagesText" type="textarea" :rows="3" placeholder="每行一个图片 URL" />
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
</style>

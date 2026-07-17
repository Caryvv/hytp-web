<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createProduct,
  listProducts,
  toggleProduct,
  updateProduct,
} from '@/api/product'
import {
  DYNASTY_OPTIONS,
  PRODUCT_STATUS_TEXT,
  TRADE_TYPE_OPTIONS,
  type ProductForm,
  type ProductListItem,
} from '@/types'

const loading = ref(false)
const list = ref<ProductListItem[]>([])
const total = ref(0)
const query = reactive({ status: '' as number | '', page: 1, pageSize: 10 })

function statusTagType(status: number): 'success' | 'info' | 'warning' | 'danger' {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'warning'
    case 3:
      return 'danger'
    default:
      return 'info'
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listProducts({
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    })
    list.value = data.list
    total.value = data.pagination.total
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ---- 编辑弹窗 ----
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)

const defaultForm = (): ProductForm => ({
  title: '',
  categoryId: 1,
  formeDynasty: 0,
  formeType: '',
  style: '',
  tradeType: 1,
  price: '',
  cover: '',
  images: [],
  detail: '',
  stock: 0,
  isOriginal: 0,
})
const form = reactive<ProductForm>(defaultForm())

function openCreate() {
  editingId.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function openEdit(row: ProductListItem) {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title,
    categoryId: row.categoryId,
    formeDynasty: row.formeDynasty,
    formeType: row.formeType,
    style: row.style,
    tradeType: row.tradeType,
    price: row.price,
    cover: row.cover,
    images: [],
    detail: '',
    stock: row.stock,
    isOriginal: row.isOriginal,
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.title || !form.price) {
    ElMessage.warning('标题和价格必填')
    return
  }
  submitting.value = true
  try {
    if (editingId.value) {
      await updateProduct(editingId.value, { ...form })
      ElMessage.success('已保存，重新提交审核')
    } else {
      await createProduct({ ...form })
      ElMessage.success('已提交，等待平台审核')
    }
    dialogVisible.value = false
    load()
  } finally {
    submitting.value = false
  }
}

async function onToggle(row: ProductListItem) {
  const action = row.status === 1 ? '下架' : '上架'
  try {
    await ElMessageBox.confirm(`确认${action}「${row.title}」？`, '提示')
  } catch {
    return
  }
  await toggleProduct(row.id)
  ElMessage.success(`${action}成功`)
  load()
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-select
        v-model="query.status"
        placeholder="全部状态"
        clearable
        style="width: 160px"
        @change="() => { query.page = 1; load() }"
      >
        <el-option label="全部状态" value="" />
        <el-option label="审核中" :value="2" />
        <el-option label="在售" :value="1" />
        <el-option label="已下架" :value="0" />
        <el-option label="违规下架" :value="3" />
      </el-select>
      <el-button type="primary" @click="openCreate">新增商品</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border style="margin-top: 12px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column prop="sales" label="销量" width="80" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ PRODUCT_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            link
            type="warning"
            @click="onToggle(row)"
          >
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商品' : '新增商品'"
      width="600px"
    >
      <el-form label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="分类ID">
          <el-input-number v-model="form.categoryId" :min="1" />
        </el-form-item>
        <el-form-item label="形制朝代">
          <el-select v-model="form.formeDynasty">
            <el-option v-for="o in DYNASTY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="形制">
          <el-input v-model="form.formeType" placeholder="如 襦裙/马面裙" />
        </el-form-item>
        <el-form-item label="风格">
          <el-input v-model="form.style" placeholder="如 原创/改良" />
        </el-form-item>
        <el-form-item label="交易类型">
          <el-select v-model="form.tradeType">
            <el-option v-for="o in TRADE_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input v-model="form.price" placeholder="如 299.00" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="是否原创">
          <el-switch v-model="form.isOriginal" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="封面URL">
          <el-input v-model="form.cover" placeholder="OSS 图片地址" />
        </el-form-item>
        <el-form-item label="图文详情">
          <el-input v-model="form.detail" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          提交审核
        </el-button>
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

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { addQualification, getQualifications, updateShop } from '@/api/shop'
import { useAuthStore } from '@/stores/auth'
import {
  SHOP_STATUS_TEXT,
  SHOP_TYPE_OPTIONS,
  type Qualification,
} from '@/types'

const auth = useAuthStore()

const form = reactive({
  name: '',
  logo: '',
  region: '',
  contactName: '',
  contactPhone: '',
  type: 1,
})
const saving = ref(false)

function syncForm() {
  if (!auth.shop) return
  form.name = auth.shop.name
  form.logo = auth.shop.logo
  form.region = auth.shop.region
  form.contactName = auth.shop.contactName
  form.contactPhone = auth.shop.contactPhone
  form.type = auth.shop.type
}

async function save() {
  saving.value = true
  try {
    const updated = await updateShop({ ...form })
    auth.shop = updated
    ElMessage.success('店铺信息已保存')
  } finally {
    saving.value = false
  }
}

// ---- 资质 ----
const quals = ref<Qualification[]>([])
const qualForm = reactive({ qualType: '营业执照', fileUrl: '' })
const qualLoading = ref(false)

const QUAL_STATUS: Record<number, string> = { 0: '待审', 1: '通过', 2: '驳回' }

async function loadQuals() {
  quals.value = await getQualifications()
}

async function submitQual() {
  if (!qualForm.fileUrl) {
    ElMessage.warning('请填写材料文件地址')
    return
  }
  qualLoading.value = true
  try {
    await addQualification(qualForm.qualType, qualForm.fileUrl)
    ElMessage.success('资质已提交')
    qualForm.fileUrl = ''
    loadQuals()
  } finally {
    qualLoading.value = false
  }
}

onMounted(async () => {
  if (!auth.shop) {
    await auth.loadShop()
  }
  syncForm()
  loadQuals()
})
</script>

<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>店铺信息</span>
          <el-tag v-if="auth.shop" size="small">{{ SHOP_STATUS_TEXT[auth.shop.status] }}</el-tag>
        </div>
      </template>

      <el-alert
        v-if="auth.shop?.status === 2 && auth.shop?.auditRemark"
        :title="`驳回理由：${auth.shop.auditRemark}`"
        type="error"
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-form label-width="90px" style="max-width: 520px">
        <el-form-item label="店铺名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="o in SHOP_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="产区">
          <el-input v-model="form.region" />
        </el-form-item>
        <el-form-item label="Logo URL">
          <el-input v-model="form.logo" placeholder="OSS 图片地址" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </el-form>
    </el-card>

    <el-card style="margin-top: 16px">
      <template #header>资质材料</template>

      <div class="qual-form">
        <el-select v-model="qualForm.qualType" style="width: 160px">
          <el-option label="营业执照" value="营业执照" />
          <el-option label="原创证明" value="原创证明" />
          <el-option label="授权协议" value="授权协议" />
        </el-select>
        <el-input v-model="qualForm.fileUrl" placeholder="材料文件 URL（OSS）" style="flex: 1" />
        <el-button type="primary" :loading="qualLoading" @click="submitQual">提交</el-button>
      </div>

      <el-table :data="quals" border style="margin-top: 12px">
        <el-table-column prop="qualType" label="类型" width="140" />
        <el-table-column prop="fileUrl" label="文件" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">{{ QUAL_STATUS[row.status] }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qual-form {
  display: flex;
  gap: 8px;
}
</style>

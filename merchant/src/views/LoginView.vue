<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { register } from '@/api/auth'
import { SHOP_TYPE_OPTIONS } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref<'login' | 'register'>('login')

const loginForm = reactive({ account: '', password: '' })
const loginLoading = ref(false)

async function onLogin() {
  if (!loginForm.account || !loginForm.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loginLoading.value = true
  try {
    await auth.login(loginForm.account, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loginLoading.value = false
  }
}

const regForm = reactive({
  account: '',
  password: '',
  name: '',
  type: 1,
  region: '',
  contactName: '',
  contactPhone: '',
})
const regLoading = ref(false)

async function onRegister() {
  if (!regForm.account || !regForm.password || !regForm.name) {
    ElMessage.warning('账号、密码、店铺名必填')
    return
  }
  regLoading.value = true
  try {
    await register({ ...regForm })
    ElMessage.success('入驻申请已提交，请等待平台审核')
    activeTab.value = 'login'
    loginForm.account = regForm.account
  } finally {
    regLoading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <template #header>
        <div class="title">汉韵同袍 · 商家端</div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form label-width="72px" @submit.prevent>
            <el-form-item label="账号">
              <el-input v-model="loginForm.account" placeholder="商家账号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="loginForm.password" type="password" show-password placeholder="密码" />
            </el-form-item>
            <el-button type="primary" :loading="loginLoading" style="width: 100%" @click="onLogin">
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="入驻申请" name="register">
          <el-form label-width="72px" @submit.prevent>
            <el-form-item label="账号">
              <el-input v-model="regForm.account" placeholder="登录账号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="regForm.password" type="password" show-password placeholder="至少6位" />
            </el-form-item>
            <el-form-item label="店铺名">
              <el-input v-model="regForm.name" placeholder="店铺名称" />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="regForm.type" style="width: 100%">
                <el-option
                  v-for="opt in SHOP_TYPE_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="产区">
              <el-input v-model="regForm.region" placeholder="如 菏泽/江浙/广州" />
            </el-form-item>
            <el-form-item label="联系人">
              <el-input v-model="regForm.contactName" placeholder="联系人姓名" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="regForm.contactPhone" placeholder="联系电话" />
            </el-form-item>
            <el-button type="primary" :loading="regLoading" style="width: 100%" @click="onRegister">
              提交入驻申请
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
}
.login-card {
  width: 420px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}
</style>

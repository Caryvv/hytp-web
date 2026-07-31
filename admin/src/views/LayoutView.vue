<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { PERM } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activeMenu = computed(() => route.path)

async function onLogout() {
  await auth.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="200px" class="aside">
      <div class="logo">汉韵同袍管理端</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/dashboard">概览</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.SHOP_AUDIT)" index="/shops">商家审核</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.PRODUCT_AUDIT)" index="/products">商品审核</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.ORDER_MANAGE)" index="/orders">订单监控</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.DEPOSIT_ARBITRATE)" index="/deposit-claims">保障金理赔</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.FEED_AUDIT)" index="/feeds">动态巡查</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.CONFIG_EDIT)" index="/configs">平台配置</el-menu-item>
        <el-menu-item v-if="auth.hasPermission(PERM.CONFIG_EDIT)" index="/app-versions">版本管理</el-menu-item>
        <el-menu-item index="/logs">操作日志</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="admin-name">{{ auth.admin?.realName || auth.admin?.username || '管理员' }}</span>
        <el-button link type="primary" @click="onLogout">退出登录</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background: #001529;
}
.logo {
  color: #fff;
  font-weight: 600;
  text-align: center;
  line-height: 60px;
  height: 60px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  background: #fff;
}
.admin-name {
  font-weight: 600;
}
:deep(.el-menu) {
  border-right: none;
  background: transparent;
}
:deep(.el-menu-item) {
  color: #c0c4cc;
}
:deep(.el-menu-item.is-active) {
  color: #fff;
  background: #1890ff;
}
</style>

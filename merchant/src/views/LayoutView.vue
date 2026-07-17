<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { SHOP_STATUS_TEXT } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activeMenu = computed(() => route.path)

const statusTagType = computed(() => {
  switch (auth.shop?.status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    case 3:
      return 'info'
    default:
      return 'warning'
  }
})

onMounted(async () => {
  // 刷新后恢复店铺信息
  if (!auth.shop) {
    try {
      await auth.loadShop()
    } catch {
      // 拦截器已处理未登录跳转
    }
  }
})

async function onLogout() {
  await auth.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="200px" class="aside">
      <div class="logo">汉韵同袍商家端</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/dashboard">工作台</el-menu-item>
        <el-menu-item index="/products">商品管理</el-menu-item>
        <el-menu-item index="/shop">店铺信息</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="shop-info">
          <span class="shop-name">{{ auth.shop?.name || '—' }}</span>
          <el-tag v-if="auth.shop" :type="statusTagType" size="small">
            {{ SHOP_STATUS_TEXT[auth.shop.status] }}
          </el-tag>
        </div>
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
.shop-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.shop-name {
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

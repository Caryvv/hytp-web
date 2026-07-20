import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '@/utils/request'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/views/LayoutView.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/views/ProductListView.vue'),
        meta: { title: '商品管理' },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/OrderListView.vue'),
        meta: { title: '订单管理' },
      },
      {
        path: 'shop',
        name: 'shop',
        component: () => import('@/views/ShopView.vue'),
        meta: { title: '店铺信息' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 全局守卫：未登录跳 /login
router.beforeEach((to) => {
  if (to.meta.public) {
    return true
  }
  if (!getToken()) {
    return { name: 'login' }
  }
  return true
})

export default router

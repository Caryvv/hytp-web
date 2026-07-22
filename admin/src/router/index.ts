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
        meta: { title: '概览' },
      },
      {
        path: 'shops',
        name: 'shops',
        component: () => import('@/views/ShopAuditView.vue'),
        meta: { title: '商家审核' },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/views/ProductAuditView.vue'),
        meta: { title: '商品审核' },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/OrderMonitorView.vue'),
        meta: { title: '订单监控' },
      },
      {
        path: 'deposit-claims',
        name: 'deposit-claims',
        component: () => import('@/views/DepositClaimView.vue'),
        meta: { title: '保障金理赔' },
      },
      {
        path: 'feeds',
        name: 'feeds',
        component: () => import('@/views/FeedManageView.vue'),
        meta: { title: '动态巡查' },
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('@/views/LogView.vue'),
        meta: { title: '操作日志' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.public) return true
  if (!getToken()) return { name: 'login' }
  return true
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { homePathForShell } from '@/adapters/platform'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/web/dashboard/DashboardView.vue') },
        { path: 'users', name: 'users', component: () => import('@/views/web/user/UsersView.vue') },
        { path: 'scan', name: 'scan', component: () => import('@/views/web/ScanView.vue') },
        { path: 'scale', name: 'scale', component: () => import('@/views/web/ScaleView.vue') },
        { path: 'hardware', name: 'hardware', component: () => import('@/views/web/HardwareView.vue') },
        { path: 'media', name: 'media', component: () => import('@/views/web/MediaView.vue') },
        { path: 'sync', name: 'sync', component: () => import('@/views/web/SyncView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/web/SettingsView.vue') },
        { path: 'app/tablet', name: 'app-tablet', component: () => import('@/views/app/tablet/Index.vue') },
        {
          path: 'app/mobile',
          component: () => import('@/views/app/mobile/MobileShell.vue'),
          children: [
            { path: '', name: 'app-mobile', redirect: { name: 'mobile-scan' } },
            { path: 'scan', name: 'mobile-scan', component: () => import('@/views/app/mobile/ScanPage.vue') },
            {
              path: 'history',
              name: 'mobile-history',
              component: () => import('@/views/app/mobile/HistoryPage.vue'),
            },
          ],
        },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/PageNotFound.vue'), meta: { public: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!auth.loaded) return true
  if (auth.unauthorized) {
    return to.name !== 'login'
  }
  if (to.meta.public) {
    if (auth.isLoggedIn && to.name === 'login') return homePathForShell()
    return true
  }
  // if (!auth.isLoggedIn) {
  //   return { name: 'login', query: { redirect: to.fullPath } }
  // }
  return true
})

export default router

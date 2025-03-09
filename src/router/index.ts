import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Cookies from 'js-cookie'
import { COOKIE_TOKEN_KEY, COOKIE_USER_KEY } from '../stores/constants'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../components/layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'competitions',
        name: 'competitions',
        component: () => import('../views/competition/CompetitionList.vue')
      },
      {
        path: 'competition/:id',
        name: 'competitionDetail',
        component: () => import('../views/competition/CompetitionDetail.vue')
      },
      {
        path: 'competition/:id/register',
        name: 'competitionRegister',
        component: () => import('../views/competition/RegistrationForm.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'user/profile',
        name: 'userProfile',
        component: () => import('../views/user/Profile.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/auth',
    component: () => import('../components/layout/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('../views/auth/Login.vue')
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('../views/auth/Register.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'competitions',
        name: 'AdminCompetitions',
        component: () => import('../views/admin/CompetitionManagement.vue'),
        meta: { title: '活动管理' }
      },
      {
        path: 'competitions/create',
        name: 'AdminCompetitionCreate',
        component: () => import('../views/admin/CompetitionForm.vue'),
        meta: { title: '创建活动' }
      },
      {
        path: 'competitions/:id/edit',
        name: 'AdminCompetitionEdit',
        component: () => import('../views/admin/CompetitionForm.vue'),
        meta: { title: '编辑活动' }
      },
      {
        path: 'competitions/:id/registrations',
        name: 'AdminRegistrations',
        component: () => import('../views/admin/RegistrationList.vue'),
        meta: { title: '报名管理' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: '用户管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 从 Cookie 中获取令牌和用户信息
  const token = Cookies.get(COOKIE_TOKEN_KEY)
  let userRole = 'user'
  
  try {
    const userString = Cookies.get(COOKIE_USER_KEY)
    if (userString) {
      const userInfo = JSON.parse(userString)
      userRole = userInfo.role
    }
  } catch (error) {
    console.error('Failed to parse user info from cookie:', error)
  }
  
  // 检查用户是否已登录
  const isAuthenticated = !!token
  
  // 检查用户是否是管理员
  const isAdmin = userRole === 'admin'
  
  // 检查是否是404页面，自动跳转到首页
  if (to.name === 'NotFound') {
    console.log('404页面被捕获，正在重定向到首页')
    next({ name: 'home' })
    return
  }
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 如果需要认证但用户未登录，重定向到登录页面
    next({ name: 'login' })
  } else if (to.meta.requiresAdmin && !isAdmin) {
    // 如果需要管理员权限但用户不是管理员，重定向到首页
    next({ name: 'home' })
  } else {
    // 正常导航
    next()
  }
})

export default router 
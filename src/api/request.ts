import axios from 'axios'
import { useUserStore } from '../stores/user'
import Cookies from 'js-cookie'

const COOKIE_TOKEN_KEY = 'event_reg_token'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7754',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    const token = userStore.token || Cookies.get(COOKIE_TOKEN_KEY)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const { response } = error
    
    if (response) {
      // 处理401错误，清除token，但在登录页面不跳转
      if (response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        
        // 如果不是在登录页面，才跳转
        const currentPath = window.location.pathname
        if (!currentPath.includes('/auth/login')) {
          window.location.href = '/auth/login'
        }
      }
      
      // 处理其他错误
      console.error('API Error:', response.data)
      return Promise.reject(response.data)
    }
    
    console.error('Network Error:', error)
    return Promise.reject(error)
  }
)

export default request 
import { defineStore } from 'pinia'
import { ref } from 'vue'
import Cookies from 'js-cookie'
import { COOKIE_TOKEN_KEY, COOKIE_USER_KEY, COOKIE_EXPIRES } from './constants'

export const useUserStore = defineStore('user', () => {
  // 从 Cookie 中获取初始状态
  const token = ref<string>(Cookies.get(COOKIE_TOKEN_KEY) || '')
  const userInfo = ref<any>(null)
  
  // 尝试从 Cookie 中恢复用户信息
  try {
    const userString = Cookies.get(COOKIE_USER_KEY)
    if (userString) {
      userInfo.value = JSON.parse(userString)
    }
  } catch (error) {
    console.error('Failed to parse user info from cookie:', error)
  }
  
  // 设置用户信息和令牌
  const setUserInfo = (user: any) => {
    userInfo.value = user
    // 保存到 Cookie
    Cookies.set(COOKIE_USER_KEY, JSON.stringify(user), { expires: COOKIE_EXPIRES })
  }
  
  // 设置令牌
  const setToken = (newToken: string) => {
    token.value = newToken
    // 保存到 Cookie
    Cookies.set(COOKIE_TOKEN_KEY, newToken, { 
      expires: COOKIE_EXPIRES,
      secure: window.location.protocol === 'https:',  // 在 HTTPS 下设置为 secure
      sameSite: 'strict'  // 增强安全性
    })
  }
  
  // 登录
  const login = (user: any, newToken: string) => {
    setUserInfo(user)
    setToken(newToken)
  }
  
  // 注销
  const logout = () => {
    userInfo.value = null
    token.value = ''
    // 清除 Cookie
    Cookies.remove(COOKIE_TOKEN_KEY)
    Cookies.remove(COOKIE_USER_KEY)
  }
  
  return {
    token,
    userInfo,
    setUserInfo,
    setToken,
    login,
    logout
  }
}) 
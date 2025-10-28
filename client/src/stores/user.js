import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, register, getUserInfo } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref({})
  const menus = ref([])

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
  }

  const setMenus = (menuList) => {
    menus.value = menuList
  }

  const loginUser = async (loginData) => {
    try {
      const response = await login(loginData)
      setToken(response.token)
      setUserInfo(response.user)
      setMenus(response.user.menus || [])
      return response
    } catch (error) {
      throw error
    }
  }

  const registerUser = async (registerData) => {
    try {
      const response = await register(registerData)
      return response
    } catch (error) {
      throw error
    }
  }

  const getUserInfoData = async () => {
    try {
      const response = await getUserInfo()
      setUserInfo(response)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    menus.value = []
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    menus,
    setToken,
    setUserInfo,
    setMenus,
    loginUser,
    registerUser,
    getUserInfoData,
    logout
  }
})

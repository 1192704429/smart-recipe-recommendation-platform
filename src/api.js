import axios from 'axios'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: 'http://127.0.0.1:8080',
  timeout: 8000
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (response) => {
    const res = response.data
    // Business error: token expired / not logged in (from any non-login endpoint)
    if (res.code === 401 && !response.config.url.includes('/auth/login')) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_name')
      ElMessage.error('登录已过期，请重新登录')
      setTimeout(() => { location.href = '/login' }, 1200)
      return Promise.reject(new Error(res.message || '未授权'))
    }
    // Other business errors
    if (res.code !== 200) {
      const isAuth = response.config.url?.includes('/api/admin/auth/')
      if (!isAuth) {
        ElMessage.error(res.message || '请求失败')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    const isAuth = error.config?.url?.includes('/api/admin/auth/')
    const msg = error.response?.data?.message || error.message || '网络异常，请检查连接'
    if (!isAuth) {
      ElMessage.error(msg)
    }
    return Promise.reject(new Error(msg))
  }
)

export default instance

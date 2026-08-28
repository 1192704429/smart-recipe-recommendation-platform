<template>
  <div class="login-page">
    <div class="bg-layer">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="login-card">
      <div class="logo-wrap">
        <span class="logo">🍳</span>
      </div>
      <h1 class="title">今日食单</h1>
      <p class="subtitle">管理后台</p>

      <el-form :model="form" class="login-form" @submit.prevent="submit">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            clearable
            :disabled="loading"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            :disabled="loading"
            @keyup.enter="submit"
          />
        </el-form-item>

        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="form.captchaCode"
              placeholder="验证码"
              size="large"
              maxlength="4"
              :disabled="loading"
              @keyup.enter="submit"
            />
            <div class="captcha-img" :class="{ loading: captchaLoading }" @click="loadCaptcha" title="点击刷新">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <span v-else class="captcha-placeholder">加载中</span>
            </div>
          </div>
        </el-form-item>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <el-button
          type="primary"
          color="var(--theme-primary)"
          size="large"
          class="submit-btn"
          :loading="loading"
          @click="submit"
        >
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const form = reactive({
  username: '',
  password: '',
  captchaKey: '',
  captchaCode: ''
})
const loading = ref(false)
const errorMsg = ref('')
const captchaImage = ref('')
const captchaLoading = ref(false)

const loadCaptcha = async () => {
  captchaLoading.value = true
  form.captchaCode = ''
  try {
    const data = await api.get('/api/admin/auth/captcha')
    form.captchaKey = data.captchaKey
    captchaImage.value = data.image
  } catch {
    captchaImage.value = ''
    errorMsg.value = '验证码加载失败，请点击图片重试'
  } finally {
    captchaLoading.value = false
  }
}

const submit = async () => {
  if (!form.username.trim() || !form.password.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  if (!form.captchaCode.trim()) {
    errorMsg.value = '请输入验证码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await api.post('/api/admin/auth/login', form)
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_name', data.nickname || '管理员')
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e.message || '登录失败'
    loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(loadCaptcha)
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(160deg, #FFF5F5 0%, #FDECEC 50%, #FFCDD2 100%);
}

.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
}

.blob-1 {
  width: 420px;
  height: 420px;
  background: #EF5350;
  top: -120px;
  left: -100px;
}

.blob-2 {
  width: 360px;
  height: 360px;
  background: #E53935;
  bottom: -80px;
  right: -60px;
}

.blob-3 {
  width: 280px;
  height: 280px;
  background: #FFCDD2;
  top: 40%;
  right: 15%;
  opacity: 0.3;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(229, 57, 53, 0.07) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 380px;
  padding: 48px 40px 40px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(61, 21, 21, 0.12);
  text-align: center;
}

.logo-wrap {
  margin-bottom: 20px;
}

.logo {
  font-size: 44px;
  line-height: 1;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--theme-text);
  letter-spacing: 2px;
}

.subtitle {
  margin: 6px 0 36px;
  font-size: 13px;
  color: #a89890;
  letter-spacing: 4px;
}

.login-form {
  text-align: left;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #F0DCDC inset;
  background: #FFFBFB;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--theme-primary) inset;
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-row .el-input {
  flex: 1;
}

.captcha-img {
  width: 120px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 0 0 1px #F0DCDC inset;
  background: #FFFBFB;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.captcha-img:hover {
  opacity: 0.85;
}

.captcha-img.loading {
  opacity: 0.6;
  pointer-events: none;
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.captcha-placeholder {
  font-size: 12px;
  color: #c0b0a8;
}

.error-msg {
  margin: 0 0 14px;
  font-size: 13px;
  color: #c75c5c;
  text-align: center;
}

.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 15px;
  letter-spacing: 4px;
  margin-top: 4px;
}
</style>

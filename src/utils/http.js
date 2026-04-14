import axios from 'axios'
import { ElMessage } from 'element-plus'
import account from '@/api/account'
import { wsClient } from '@/utils/ws'
import { useAccountStore } from '@/stores/AccountStore'
import { useComponentStore } from '@/stores/ComponentStore'
// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  },
  withCredentials: true
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)
function parseJwt(token) {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    console.error('解析 token 失败:', error);
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

// 响应拦截器 - 修改重点
service.interceptors.response.use(
  response => {
    const res = response.data

    // 如果是二进制数据（图片、文件下载），直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }

    // 根据后端 Result 类判断：成功时 code=1
    if (res.code === 1) {
      return res
    } else {
      // 业务错误 - 直接显示后端返回的错误信息
      const errorMsg = res.msg || '操作失败'
      ElMessage.error(errorMsg)

      // 创建一个包含后端错误信息的错误对象，以便上层可以获取具体错误
      const apiError = new Error(errorMsg)
      apiError.code = res.code
      apiError.backendMsg = res.msg
      apiError.data = res.data

      return Promise.reject(apiError)
    }
  },
  error => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      if (data && typeof data === 'object' && data.msg) {
        ElMessage.error(data.msg)
        const apiError = new Error(data.msg)
        apiError.code = data.code
        apiError.backendMsg = data.msg
        apiError.data = data.data
        return Promise.reject(apiError)
      }
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          break
        case 4011: {
          localStorage.removeItem('token')
          const accountStore = useAccountStore()
          const componentStore = useComponentStore()
          accountStore.user = null
          accountStore.isLogin = false
          wsClient.close()
          ElMessage.error('您的账号在其他设备登录')
          componentStore.showAuthDialog = true
          break
        }
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('资源不存在')
          break
        case 500:
          ElMessage.error(data?.msg || '服务器错误')
          break
        default:
          ElMessage.error(data?.msg || `请求错误：${status}`)
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error(error.message || '未知错误')
    }
    return Promise.reject(error)
  }
)

const http = {
  /**
   * GET 请求
   */
  get(url, params = {}, config = {}) {
    return service.get(url, { params, ...config })
  },

  /**
   * POST 请求
   */
  post(url, data = {}, config = {}) {
    return service.post(url, data, config)
  },

  /**
   * PUT 请求
   */
  put(url, data = {}, config = {}) {
    return service.put(url, data, config)
  },

  /**
   * DELETE 请求
   */
  delete(url, params = {}, config = {}) {
    return service.delete(url, { params, ...config })
  },

  /**
   * 获取验证码图片（返回 blob）
   * @param {string} url 验证码接口地址
   * @param {object} params 参数 {type: '0' | '1'}
   */
  getCaptcha(url, params) {
    return service.get(url, {
      params,
      responseType: 'blob'
    })
  },

  /**
   * 验证验证码
   * @param {string} url 验证接口地址
   * @param {object} params 参数 {checkCode: string, type: string}
   */
  verifyCaptcha(url, params) {
    return service.get(url, { params }).then(res => res.code === 1)
  },

  /**
   * 上传文件
   */
  upload(url, formData, onUploadProgress) {
    return service.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  },

  /**
   * 下载文件
   */
  download(url, params = {}, filename = 'file') {
    return service.get(url, {
      params,
      responseType: 'blob'
    }).then(response => {
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    })
  },

  setBaseURL(baseURL) {
    service.defaults.baseURL = baseURL
  },

  setTimeout(timeout) {
    service.defaults.timeout = timeout
  },

  setHeaders(headers) {
    Object.assign(service.defaults.headers, headers)
  }
}

export default http

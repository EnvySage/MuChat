import imageCompression from 'browser-image-compression'

// ==================== 文件大小限制 ====================
export const FILE_SIZE_LIMITS = {
    IMAGE: 10 * 1024 * 1024,     // 图片：10MB
    VIDEO: 200 * 1024 * 1024,    // 视频：200MB
    FILE: 1024 * 1024 * 1024,    // 其他文件：1GB
}

// ==================== 图片压缩选项 ====================
const IMAGE_COMPRESS_OPTIONS = {
    maxSizeMB: 10,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
}

// ==================== 文件类型映射 ====================
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
const VIDEO_EXTS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']

/**
 * 根据文件扩展名判断 contentType
 */
export const getContentTypeByFile = (file) => {
    const ext = file.name.toLowerCase().split('.').pop()
    if (IMAGE_EXTS.includes(ext)) return 'IMAGE'
    if (VIDEO_EXTS.includes(ext)) return 'VIDEO'
    if (ext === 'pdf') return 'PDF'
    if (['doc', 'docx'].includes(ext)) return 'WORD'
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'EXCEL'
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'ZIP'
    return 'FILE'
}

/**
 * 获取文件类型对应的大小限制
 */
export const getSizeLimit = (contentType) => {
    if (contentType === 'IMAGE') return FILE_SIZE_LIMITS.IMAGE
    if (contentType === 'VIDEO') return FILE_SIZE_LIMITS.VIDEO
    return FILE_SIZE_LIMITS.FILE
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024
        i++
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * 根据 contentType 返回文件图标 CSS 类名
 */
export const getFileIconClass = (contentType) => {
    const map = {
        PDF: 'pdf-icon',
        WORD: 'word-icon',
        EXCEL: 'excel-icon',
        ZIP: 'zip-icon',
        VIDEO: 'video-icon',
        FILE: 'file-default-icon',
    }
    return map[contentType] || 'file-default-icon'
}

/**
 * 压缩图片文件
 * @param {File} file - 原始图片文件
 * @returns {Promise<{ file: File, compressed: boolean }>} - 压缩后的文件及是否进行了压缩
 */
export const compressImage = async (file) => {
    try {
        const compressed = await imageCompression(file, IMAGE_COMPRESS_OPTIONS)
        return { file: compressed, compressed: true }
    } catch (err) {
        console.warn('[compressImage] 图片压缩失败，使用原始文件:', err)
        return { file, compressed: false }
    }
}

/**
 * 校验文件大小是否超出限制
 * @param {File} file - 文件对象
 * @param {string} contentType - 消息类型
 * @returns {{ valid: boolean, limit: number, actual: number }}
 */
export const validateFileSize = (file, contentType) => {
    const limit = getSizeLimit(contentType)
    return {
        valid: file.size <= limit,
        limit,
        actual: file.size,
    }
}

/**
 * 获取图片宽高
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(null)
        }
        img.src = url
    })
}

/**
 * 下载文件（OSS 公共读，浏览器直接打开 URL 触发下载）
 * @param {string} url - 文件 URL
 * @param {string} fileName - 文件名
 */
export const downloadFile = (url, fileName) => {
    if (!url) return
    window.open(url, '_blank')
}

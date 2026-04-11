import OSS from 'ali-oss';
import chat from '@/api/chat';
import { ElMessage } from 'element-plus';

/**
 * OSS 上传工具类
 */
class OssUploader {
    constructor() {
        this.client = null;
        this.tokenData = null;
    }

    /**
     * 获取上传凭证
     * @param {Object} params - 上传参数
     * @param {string} params.type - 上传类型，如 'user-avatar', 'group-avatar'
     * @param {string} [params.targetId] - 目标ID，group-avatar 时必传
     */
    async getToken({ type = 'user-avatar', targetId } = {}) {
        try {
            const params = { type };
            if (targetId) params.targetId = targetId;
            const res = await chat.getOssToken(params);
            if (res.code === 1 || res.code === 200) {
                this.tokenData = res.data;
                this.client = new OSS({
                    accessKeyId: res.data.accessKeyId,
                    accessKeySecret: res.data.accessKeySecret,
                    stsToken: res.data.securityToken,
                    bucket: res.data.bucket,
                    endpoint: res.data.endpoint
                });
                return res.data;
            }
            throw new Error(res.msg || '获取上传凭证失败');
        } catch (error) {
            console.error('获取OSS凭证失败:', error);
            throw error;
        }
    }

    /**
     * 上传文件到 OSS
     * @param {File} file - 要上传的文件对象
     * @param {Object} options - 上传选项
     * @param {string} options.type - 上传类型，如 'user-avatar', 'group-avatar'
     * @param {string} [options.targetId] - 目标ID，group-avatar 时必传
     * @returns {Promise<string>} - 返回上传后的文件 URL
     */
    async upload(file, { type = 'user-avatar', targetId } = {}) {
        try {
            // 每次上传前获取新凭证
            const tokenData = await this.getToken({ type, targetId });

            // 生成文件名：时间戳 + 随机字符串 + 文件后缀
            const ext = file.name.split('.').pop();
            // 使用 tokenData 中返回的 folder 路径
            const folder = tokenData.folder || type;
            const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

            // 上传文件
            const result = await this.client.put(fileName, file);

            if (result.res.status === 200 || result.url) {
                return result.url;
            }

            throw new Error('上传失败');
        } catch (error) {
            console.error('OSS上传失败:', error);
            throw error;
        }
    }
}

// 导出单例
export const ossUploader = new OssUploader();
export default ossUploader;

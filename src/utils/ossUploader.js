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
     * @param {string} folder - 上传文件夹，如 'user-avatar', 'chat-image', 'chat-file'
     */
    async getToken(folder = 'user-avatar') {
        try {
            const res = await chat.getOssToken(folder);
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
     * @param {string} folder - 上传目标文件夹
     * @returns {Promise<string>} - 返回上传后的文件 URL
     */
    async upload(file, folder = 'user-avatar') {
        try {
            // 每次上传前获取新凭证
            await this.getToken(folder);

            // 生成文件名：时间戳 + 随机字符串 + 文件后缀
            const ext = file.name.split('.').pop();
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

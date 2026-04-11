<template>
    <el-dialog
        v-model="dialogVisible"
        title="修改个人信息"
        width="400px"
        :close-on-click-modal="false"
    >
        <div class="edit-user-info">
            <!-- 头像 -->
            <div class="avatar-section">
                <div class="avatar-preview">
                    <img :src="form.avatar || defaultImg" alt="头像">
                </div>
                <el-button size="small" @click="triggerFileInput">
                    更换头像
                </el-button>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handleFileChange"
                >
            </div>

            <el-form :model="form" label-width="80px" class="user-form">
                <el-form-item label="昵称">
                    <el-input v-model="form.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="个性签名">
                    <el-input
                        v-model="form.description"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入个性签名"
                    />
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false" :disabled="submitting">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :disabled="!form.nickname" :loading="submitting">
                    保存
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useAccountStore } from '@/stores/AccountStore';
import defaultImg from '@/assets/default.png';
import { ElMessage } from 'element-plus';
import ossUploader from '@/utils/ossUploader';
import chat from '@/api/chat';


const accountStore = useAccountStore();

const dialogVisible = ref(false);
const fileInputRef = ref(null);
const pendingFile = ref(null); // 待上传的文件
const submitting = ref(false); // 提交中状态

const form = ref({
    nickname: '',
    description: '',
    avatar: null
});

// 打开弹窗
const open = () => {
    dialogVisible.value = true;
    pendingFile.value = null;
    form.value = {
        nickname: accountStore.user.nickname || '',
        description: accountStore.user.description || '',
        avatar: accountStore.user.avatar || null
    };
};

// 触发文件选择
const triggerFileInput = () => {
    fileInputRef.value?.click();
};

// 处理文件选择 - 仅本地预览，不上传
const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        ElMessage.error('请选择图片文件');
        return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
        ElMessage.error('图片大小不能超过 5MB');
        return;
    }

    // 本地预览
    const reader = new FileReader();
    reader.onload = (e) => {
        form.value.avatar = e.target?.result; // 预览 base64
    };
    reader.readAsDataURL(file);

    // 保存待上传文件
    pendingFile.value = file;

    // 清空 input，允许重复选择同一文件
    event.target.value = '';
};

// 确认保存 - 上传图片并提交
const emit = defineEmits(['confirm']);
const handleConfirm = async () => {
    if (!form.value.nickname) {
        ElMessage.error('请输入昵称');
        return;
    }

    submitting.value = true;
    try {
        let avatarUrl = form.value.avatar;

        // 如果有待上传的文件，先上传到 OSS
        if (pendingFile.value) {
            avatarUrl = await ossUploader.upload(pendingFile.value, { type: 'user-avatar' });
            // 调用后端接口更新头像
            const res = await chat.updateAvatar(avatarUrl);
            if (res.code !== 1 && res.code !== 200) {
                throw new Error(res.msg || '更新头像失败');
            }
            // 更新本地用户信息
            accountStore.user.avatar = avatarUrl;
        }

        emit('confirm', {
            nickname: form.value.nickname,
            description: form.value.description,
            avatar: avatarUrl
        });
        dialogVisible.value = false;
    } catch (error) {
        console.error('保存失败:', error);
        ElMessage.error(error.message || '保存失败，请重试');
    } finally {
        submitting.value = false;
    }
};

defineExpose({
    open
});
</script>

<style lang="scss" scoped>
.edit-user-info {
    .avatar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;

        .avatar-preview {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 10px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
    }

    .user-form {
        width: 100%;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>

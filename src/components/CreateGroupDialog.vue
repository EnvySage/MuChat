<template>
    <el-dialog
        v-model="dialogVisible"
        title="创建群聊"
        width="600px"
        :close-on-click-modal="false"
    >
        <div class="create-group-container">
            <!-- 左侧：头像和填写字段 -->
            <div class="left-section">
                <div class="avatar-preview">
                    <img :src="form.avatarUrl ? form.avatarUrl : defaultImg" alt="群头像">
                </div>
                <el-button size="small" @click="triggerFileInput">
                    更换群头像
                </el-button>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handleFileChange"
                >
                <el-form :model="form" label-width="80px" class="group-form">
                    <el-form-item label="群名称">
                        <el-input v-model="form.name" placeholder="请输入群名称" />
                    </el-form-item>
                    <el-form-item label="群描述">
                        <el-input
                            v-model="form.description"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入群描述"
                        />
                    </el-form-item>
                </el-form>
            </div>

            <!-- 右侧：联系人列表 -->
            <div class="right-section">
                <div class="contact-header">
                    <span>选择联系人</span>
                    <span class="selected-count">已选 {{ selectedContacts.length }} 人</span>
                </div>
                <el-scrollbar class="contact-list">
                    <div
                        v-for="contact in contactList"
                        :key="contact.contactId"
                        class="contact-item"
                        :class="{ selected: selectedContacts.includes(contact.contactId) }"
                        @click="toggleContact(contact.contactId)"
                    >
                        <div class="checkbox">
                            <el-icon v-if="selectedContacts.includes(contact.contactId)">
                                <Check />
                            </el-icon>
                        </div>
                        <img
                            :src="contact.contactAvatar || defaultImg"
                            alt="avatar"
                            class="contact-avatar"
                        >
                        <span class="contact-name">{{ contact.alias || contact.contactNickname }}</span>
                    </div>
                </el-scrollbar>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false" :disabled="submitting">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :disabled="!form.name || !selectedContacts.length" :loading="submitting">
                    创建
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useContactStore } from '@/stores/ContactStore';
import { useAccountStore } from '@/stores/AccountStore';
import defaultImg from '@/assets/default.png';
import { Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ossUploader from '@/utils/ossUploader';

const ContactStore = useContactStore();
const accountStore = useAccountStore();

const dialogVisible = ref(false);
const fileInputRef = ref(null);
const pendingFile = ref(null); // 待上传的文件
const submitting = ref(false); // 提交中状态
const contactList = computed(() => ContactStore.contactList || []);
const selectedContacts = ref([]);

const form = ref({
    name: '',
    type: 'GROUP',
    creatorId: accountStore.user.id,
    description: '',
    avatarUrl: null
});

// 打开弹窗
const open = () => {
    dialogVisible.value = true;
    selectedContacts.value = [];
    pendingFile.value = null;
    form.value = {
        name: '',
        type: 'GROUP',
        creatorId: accountStore.user.id,
        description: '',
        avatarUrl: null
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
        form.value.avatarUrl = e.target?.result; // 预览 base64
    };
    reader.readAsDataURL(file);

    // 保存待上传文件
    pendingFile.value = file;

    // 清空 input，允许重复选择同一文件
    event.target.value = '';
};

// 切换联系人选择
const toggleContact = (contactId) => {
    const index = selectedContacts.value.indexOf(contactId);
    if (index === -1) {
        selectedContacts.value.push(contactId);
    } else {
        selectedContacts.value.splice(index, 1);
    }
};

// 确认创建
const emit = defineEmits(['confirm']);
const handleConfirm = async () => {
    if (!form.value.name) {
        ElMessage.error('请输入群名称');
        return;
    }
    if (selectedContacts.value.length === 0) {
        ElMessage.error('请选择至少一个联系人');
        return;
    }

    submitting.value = true;
    try {
        let avatarUrl = form.value.avatarUrl;

        // 如果有待上传的文件，先上传到 OSS
        if (pendingFile.value) {
            avatarUrl = await ossUploader.upload(pendingFile.value, 'group-avatar');
        }

        emit('confirm', {
            ...form.value,
            avatarUrl: avatarUrl || '',
            memberIdList: selectedContacts.value
        });
        dialogVisible.value = false;
    } catch (error) {
        console.error('创建群聊失败:', error);
        ElMessage.error(error.message || '创建群聊失败，请重试');
    } finally {
        submitting.value = false;
    }
};

defineExpose({
    open
});
</script>

<style lang="scss" scoped>
.create-group-container {
    display: flex;
    gap: 20px;
    height: 300px;

    .left-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-right: 20px;
        border-right: 1px solid #eee;

        .avatar-preview {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 10px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        .group-form {
            width: 100%;
        }
    }

    .right-section {
        flex: 1;
        display: flex;
        flex-direction: column;

        .contact-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-weight: bold;

            .selected-count {
                font-size: 12px;
                color: #666;
                font-weight: normal;
            }
        }

        .contact-list {
            flex: 1;
            overflow: hidden;

            .contact-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s;
                margin-bottom: 4px;

                &:hover {
                    background: #f5f5f5;
                }

                &.selected {
                    background: #e3f2fd;
                }

                .checkbox {
                    width: 20px;
                    height: 20px;
                    border: 1px solid #dcdfe6;
                    border-radius: 4px;
                    margin-right: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;

                    .selected & {
                        background: #409eff;
                        border-color: #409eff;
                        color: white;
                    }
                }

                .contact-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    margin-right: 10px;
                    object-fit: cover;
                }

                .contact-name {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>

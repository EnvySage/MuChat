<template>
    <el-dialog v-model="dialogVisible" title="邀请好友进群" width="600px" :close-on-click-modal="false">
        <div class="invite-member-container">
            <!-- 左侧：群信息 -->
            <div class="left-section">
                <div class="group-info">
                    <div class="group-avatar">
                        <img :src="currentRoom?.avatarUrl || defaultImg" alt="群头像">
                    </div>
                    <div class="group-details">
                        <div class="group-name">{{ currentRoom?.name || '群聊' }}</div>
                        <div class="member-count">已有 {{ currentRoom?.memberCount || 0 }} 人</div>
                    </div>
                </div>
                <div class="invite-tips">
                    <el-icon>
                        <InfoFilled />
                    </el-icon>
                    <span>邀请的好友需同意后才会加入群聊</span>
                </div>
            </div>

            <!-- 右侧：联系人列表 -->
            <div class="right-section">
                <div class="contact-header">
                    <span>选择联系人</span>
                    <span class="selected-count">已选 {{ selectedContacts.length }} 人</span>
                </div>
                <el-input v-model="searchKeyword" placeholder="搜索联系人" prefix-icon="Search" clearable
                    class="search-input" />
                <el-scrollbar class="contact-list">
                    <div v-for="contact in filteredContacts" :key="contact.contactId" class="contact-item" :class="{
                        selected: selectedContacts.includes(contact.contactId),
                        disabled: isAlreadyMember(contact.contactId)
                    }" @click="toggleContact(contact.contactId)">
                        <div class="checkbox">
                            <el-icon v-if="selectedContacts.includes(contact.contactId)">
                                <Check />
                            </el-icon>
                        </div>
                        <img :src="contact.contactAvatar || defaultImg" alt="avatar" class="contact-avatar">
                        <span class="contact-name">{{ contact.alias || contact.contactNickname }}</span>
                        <span v-if="isAlreadyMember(contact.contactId)" class="member-tag">已入群</span>
                    </div>
                </el-scrollbar>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :disabled="selectedContacts.length === 0"
                    :loading="submitting">
                    邀请 ({{ selectedContacts.length }})
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useContactStore } from '@/stores/ContactStore';
import { useChatRoomStore } from '@/stores/ChatRoomStore';
import { useComponentStore } from '@/stores/ComponentStore';
import defaultImg from '@/assets/default.png';
import { Check, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const contactStore = useContactStore();
const chatRoomStore = useChatRoomStore();
const componentStore = useComponentStore();

const dialogVisible = computed({
    get: () => componentStore.showInviteDialog,
    set: (val) => { componentStore.showInviteDialog = val }
});

const currentRoom = computed(() => chatRoomStore.currentChatRoom);
const contactList = computed(() => contactStore.contactList || []);
const selectedContacts = ref([]);
const searchKeyword = ref('');
const submitting = ref(false);

// 已在群中的成员ID列表
const existingMemberIds = computed(() => {
    return currentRoom.value?.members?.map(m => m.userId) || [];
});

// 过滤联系人（搜索 + 排除已在群中的）
const filteredContacts = computed(() => {
    let list = contactList.value;

    // 搜索过滤
    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        list = list.filter(contact =>
            (contact.alias || contact.contactNickname || '').toLowerCase().includes(keyword)
        );
    }

    return list;
});

// 判断是否已在群中
const isAlreadyMember = (contactId) => {
    return existingMemberIds.value.includes(contactId);
};

// 切换联系人选择
const toggleContact = (contactId) => {
    // 如果已在群中，不允许选择
    if (isAlreadyMember(contactId)) {
        return;
    }

    const index = selectedContacts.value.indexOf(contactId);
    if (index === -1) {
        selectedContacts.value.push(contactId);
    } else {
        selectedContacts.value.splice(index, 1);
    }
};

// 取消
const handleCancel = () => {
    dialogVisible.value = false;
};

// 确认邀请
const emit = defineEmits(['confirm']);
const handleConfirm = async () => {
    if (selectedContacts.value.length === 0) {
        ElMessage.warning('请选择至少一个联系人');
        return;
    }

    submitting.value = true;
    try {
        await chatRoomStore.inviteMember({
            chatRoomId: currentRoom.value?.id,
            userIdList: selectedContacts.value
        });
        emit('confirm', selectedContacts.value);
        dialogVisible.value = false;
    } catch (error) {
        console.error('邀请成员失败:', error);
        ElMessage.error('邀请失败，请重试');
    } finally {
        submitting.value = false;
    }
};

// 监听弹窗打开，重置状态
watch(dialogVisible, (val) => {
    if (val) {
        selectedContacts.value = [];
        searchKeyword.value = '';
    }
});
</script>

<style lang="scss" scoped>
.invite-member-container {
    display: flex;
    gap: 20px;
    height: 350px;

    .left-section {
        flex: 0 0 180px;
        display: flex;
        flex-direction: column;
        padding-right: 20px;
        border-right: 1px solid #eee;

        .group-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;

            .group-avatar {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 12px;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .group-details {
                text-align: center;

                .group-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 4px;
                }

                .member-count {
                    font-size: 12px;
                    color: #999;
                }
            }
        }

        .invite-tips {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #999;
            padding: 8px 12px;
            background: #f5f5f5;
            border-radius: 6px;

            .el-icon {
                color: #409eff;
            }
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

        .search-input {
            margin-bottom: 10px;
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

                &:hover:not(.disabled) {
                    background: #f5f5f5;
                }

                &.selected {
                    background: #e3f2fd;
                }

                &.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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
                    flex-shrink: 0;

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
                    flex-shrink: 0;
                }

                .contact-name {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .member-tag {
                    font-size: 11px;
                    color: #999;
                    background: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
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

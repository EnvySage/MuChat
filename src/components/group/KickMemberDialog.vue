<template>
    <el-dialog v-model="dialogVisible" title="踢出群成员" width="600px" :close-on-click-modal="false">
        <div class="kick-member-container">
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
                <div class="kick-tips">
                    <el-icon>
                        <WarningFilled />
                    </el-icon>
                    <span>踢出后该成员将退出群聊，可通过邀请重新加入</span>
                </div>
            </div>

            <!-- 右侧：成员列表 -->
            <div class="right-section">
                <div class="member-header">
                    <span>选择成员</span>
                    <span class="selected-count">已选 {{ selectedMembers.length }} 人</span>
                </div>
                <el-input v-model="searchKeyword" placeholder="搜索成员" prefix-icon="Search" clearable
                    class="search-input" />
                <el-scrollbar class="member-list">
                    <div v-for="member in filteredMembers" :key="member.userId" class="member-item" :class="{
                        selected: selectedMembers.includes(member.userId),
                        disabled: !canKick(member)
                    }" @click="toggleMember(member)">
                        <div class="checkbox">
                            <el-icon v-if="selectedMembers.includes(member.userId)">
                                <Check />
                            </el-icon>
                        </div>
                        <img :src="member.avatarUrl || defaultImg" alt="avatar" class="member-avatar">
                        <span class="member-name">{{ member.userName }}</span>
                        <span class="role-tag" :class="member.role?.toLowerCase()" v-if="member.role?.toLowerCase() !== 'member'">
                            {{ member.role === 'OWNER' || member.role === 'owner' ? '群主' : '管理员' }}
                        </span>
                        <span v-if="!canKick(member)" class="no-permission-tag">无权操作</span>
                    </div>
                    <div class="empty-tip" v-if="filteredMembers.length === 0">没有可操作的成员</div>
                </el-scrollbar>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="danger" @click="handleConfirm" :disabled="selectedMembers.length === 0"
                    :loading="submitting">
                    踢出 ({{ selectedMembers.length }})
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useChatRoomStore } from '@/stores/ChatRoomStore';
import { useComponentStore } from '@/stores/ComponentStore';
import { useAccountStore } from '@/stores/AccountStore';
import defaultImg from '@/assets/default.png';
import { Check, WarningFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const chatRoomStore = useChatRoomStore();
const componentStore = useComponentStore();
const accountStore = useAccountStore();

const dialogVisible = computed({
    get: () => componentStore.showKickDialog,
    set: (val) => { componentStore.showKickDialog = val }
});

const currentRoom = computed(() => chatRoomStore.currentChatRoom);
const selectedMembers = ref([]);
const searchKeyword = ref('');
const submitting = ref(false);

// 当前用户角色权重
const roleWeight = (role) => {
    switch (role?.toLowerCase()) {
        case 'owner': return 0
        case 'admin': return 1
        default: return 2
    }
};

const currentUserRole = computed(() => {
    const userId = accountStore.user?.id;
    const member = currentRoom.value?.members?.find(m => String(m.userId) === String(userId));
    return member?.role || '';
});

const currentWeight = computed(() => roleWeight(currentUserRole.value));

// 是否可以踢出该成员（排除自己、权限比自己高或相同的人）
const canKick = (member) => {
    const myUserId = accountStore.user?.id;
    if (String(member.userId) === String(myUserId)) return false;
    return roleWeight(member.role) > currentWeight.value;
};

// 过滤成员列表：排除自己，搜索
const filteredMembers = computed(() => {
    const myUserId = accountStore.user?.id;
    let list = (currentRoom.value?.members || []).filter(m => String(m.userId) !== String(myUserId));

    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        list = list.filter(m => (m.userName || '').toLowerCase().includes(keyword));
    }

    return list;
});

// 切换成员选择
const toggleMember = (member) => {
    if (!canKick(member)) return;

    const index = selectedMembers.value.indexOf(member.userId);
    if (index === -1) {
        selectedMembers.value.push(member.userId);
    } else {
        selectedMembers.value.splice(index, 1);
    }
};

// 取消
const handleCancel = () => {
    dialogVisible.value = false;
};

// 确认踢出
const emit = defineEmits(['confirm']);
const handleConfirm = async () => {
    if (selectedMembers.value.length === 0) {
        ElMessage.warning('请选择至少一个成员');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定将选中的 ${selectedMembers.value.length} 人踢出群聊？`,
            '确认踢出',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );
    } catch {
        return;
    }

    submitting.value = true;
    try {
        await chatRoomStore.kickMember({
            chatRoomId: currentRoom.value?.id,
            userIdList: selectedMembers.value
        });
        emit('confirm', selectedMembers.value);
        dialogVisible.value = false;
    } catch (error) {
        console.error('踢出成员失败:', error);
        ElMessage.error('踢出失败，请重试');
    } finally {
        submitting.value = false;
    }
};

// 监听弹窗打开，重置状态
watch(dialogVisible, (val) => {
    if (val) {
        selectedMembers.value = [];
        searchKeyword.value = '';
    }
});
</script>

<style lang="scss" scoped>
.kick-member-container {
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

        .kick-tips {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #e6a23c;
            padding: 8px 12px;
            background: #fdf6ec;
            border-radius: 6px;

            .el-icon {
                color: #e6a23c;
            }
        }
    }

    .right-section {
        flex: 1;
        display: flex;
        flex-direction: column;

        .member-header {
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

        .member-list {
            flex: 1;
            overflow: hidden;

            .member-item {
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
                    background: #fef0f0;
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
                        background: #f56c6c;
                        border-color: #f56c6c;
                        color: white;
                    }
                }

                .member-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    margin-right: 10px;
                    object-fit: cover;
                    flex-shrink: 0;
                }

                .member-name {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .role-tag {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;

                    &.owner {
                        color: #f56c6c;
                        background: #fef0f0;
                    }

                    &.admin {
                        color: #67c23a;
                        background: #f0f9eb;
                    }
                }

                .no-permission-tag {
                    font-size: 11px;
                    color: #999;
                    background: #f5f5f5;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                }
            }

            .empty-tip {
                text-align: center;
                color: #999;
                font-size: 13px;
                padding: 30px 0;
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

<template>
    <el-dialog v-model="dialogVisible" title="管理员设置" width="600px" :close-on-click-modal="false" class="admin-dialog">
        <div class="admin-dialog-body">
            <div class="admin-panel">
                <div class="admin-panel-title">群成员</div>
                <div class="admin-panel-list">
                    <div class="admin-member-item" v-for="member in leftList" :key="member.userId"
                        @click="addToAdmin(member)">
                        <img class="admin-member-avatar" :src="member.avatarUrl || defaultImg" />
                        <span class="admin-member-name">{{ member.userName }}</span>
                        <el-icon color="var(--primary-color)">
                            <ArrowRight />
                        </el-icon>
                    </div>
                    <div class="admin-panel-empty" v-if="leftList.length === 0">暂无可设置成员</div>
                </div>
            </div>
            <div class="admin-panel">
                <div class="admin-panel-title">管理员 ({{ rightList.length }}/5)</div>
                <div class="admin-panel-list">
                    <div class="admin-member-item" v-for="member in rightList" :key="member.userId"
                        @click="removeFromAdmin(member)">
                        <el-icon color="#f56c6c">
                            <ArrowLeft />
                        </el-icon>
                        <img class="admin-member-avatar" :src="member.avatarUrl || defaultImg" />
                        <span class="admin-member-name">{{ member.userName }}</span>
                    </div>
                    <div class="admin-panel-empty" v-if="rightList.length === 0">暂无管理员</div>
                </div>
            </div>
        </div>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useChatRoomStore } from '@/stores/ChatRoomStore';
import { useComponentStore } from '@/stores/ComponentStore';
import { useAccountStore } from '@/stores/AccountStore';
import defaultImg from '@/assets/default.png';
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const chatRoomStore = useChatRoomStore();
const componentStore = useComponentStore();
const accountStore = useAccountStore();

const dialogVisible = computed({
    get: () => componentStore.showAdminDialog,
    set: (val) => { componentStore.showAdminDialog = val }
});

const currentRoom = computed(() => chatRoomStore.currentChatRoom);
const submitting = ref(false);
const rightList = ref([]); // 管理员列表（右侧）

// 左侧：群成员中除去已在右侧的、排除群主、排除自己
const leftList = computed(() => {
    const rightIds = new Set(rightList.value.map(m => m.userId));
    const myUserId = accountStore.user?.id;
    const members = currentRoom.value?.members || [];
    return members.filter(m => {
        if (rightIds.has(m.userId)) return false;
        if (String(m.userId) === String(myUserId)) return false;
        if (m.role?.toLowerCase() === 'owner') return false;
        return true;
    });
});

// 初始管理员ID集合，用于判断哪些是变化的数据
const originalAdminIds = ref(new Set());

const addToAdmin = (member) => {
    if (rightList.value.length >= 5) {
        ElMessage.warning('管理员最多设置5名');
        return;
    }
    rightList.value.push({ ...member });
};

const removeFromAdmin = (member) => {
    const idx = rightList.value.findIndex(m => m.userId === member.userId);
    if (idx !== -1) rightList.value.splice(idx, 1);
};

// 弹窗打开时，初始化右侧为当前管理员
watch(dialogVisible, (val) => {
    if (val) {
        const members = currentRoom.value?.members || [];
        rightList.value = members.filter(m => m.role?.toLowerCase() === 'admin').map(m => ({ ...m }));
        originalAdminIds.value = new Set(rightList.value.map(m => m.userId));
    }
});

const handleSubmit = async () => {
    const chatRoomId = currentRoom.value?.id;
    const newAdminIds = new Set(rightList.value.map(m => m.userId));

    // 新增管理员：原来不是，现在是
    const toAddIds = [...newAdminIds].filter(id => !originalAdminIds.value.has(id));
    // 取消管理员：原来是，现在不是
    const toRemoveIds = [...originalAdminIds.value].filter(id => !newAdminIds.has(id));

    if (toAddIds.length === 0 && toRemoveIds.length === 0) {
        ElMessage.info('没有变更');
        dialogVisible.value = false;
        return;
    }

    submitting.value = true;
    try {
        for (const userId of toAddIds) {
            await chatRoomStore.changeAdmin({ chatRoomId, userId, isAdmin: 1 });
        }
        for (const userId of toRemoveIds) {
            await chatRoomStore.changeAdmin({ chatRoomId, userId, isAdmin: 0 });
        }
        dialogVisible.value = false;
    } catch (error) {
        console.error('管理员设置失败:', error);
        ElMessage.error('操作失败，请重试');
    } finally {
        submitting.value = false;
    }
};
</script>

<style lang="scss">
.admin-dialog {
    .el-dialog {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }

    .el-dialog__header {
        background-color: #f5f7fa;
        margin-right: 0;
        padding: 16px 20px;
        border-bottom: 1px solid #e4e7ed;
    }

    .el-dialog__title {
        color: #303133 !important;
        font-weight: 600;
    }

    .el-dialog__headerbtn .el-dialog__close {
        color: #909399 !important;

        &:hover {
            color: #303133 !important;
        }
    }

    .el-dialog__body {
        padding: 20px;
    }

    .el-dialog__footer {
        padding: 12px 20px;
        border-top: 1px solid #e4e7ed;
    }

    .admin-dialog-body {
        display: flex;
        gap: 20px;
        min-height: 320px;

        .admin-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 1px solid #e4e7ed;
            border-radius: 10px;
            overflow: hidden;
            background-color: #fafafa;

            .admin-panel-title {
                padding: 12px 14px;
                font-size: 13px;
                font-weight: 600;
                color: #303133;
                background-color: #f5f7fa;
                text-align: center;
                border-bottom: 1px solid #e4e7ed;
                letter-spacing: 1px;
            }

            .admin-panel-list {
                flex: 1;
                overflow-y: auto;
                padding: 6px;

                &::-webkit-scrollbar {
                    width: 4px;
                }

                &::-webkit-scrollbar-thumb {
                    background: #c0c4cc;
                    border-radius: 2px;
                }
            }

            .admin-panel-empty {
                text-align: center;
                color: #c0c4cc;
                font-size: 12px;
                padding: 30px 0;
            }
        }

        .admin-member-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background-color: #ecf5ff;
            }

            .admin-member-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                border: 1px solid #e4e7ed;
            }

            .admin-member-name {
                flex: 1;
                font-size: 13px;
                color: #303133;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}
</style>

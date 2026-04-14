<template>
    <div class="title">联系人</div>
    <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="搜索联系人" clearable size="default" prefix-icon="Search" />
    </div>

    <el-scrollbar height="100%" @end-reached="loadMoreContact">
        <div class="warn" v-if="contactList.length <= 0">你还没有添加联系人哦</div>
        <div v-for="item in filteredList" :key="item.id" class="scrollbar-demo-item" @click="selectContact(item)">
            <div class="avatar">
                <img :src="item.contactAvatar || defaultImg" alt=""></img>
                <span
                    class="status-dot"
                    :class="{ online: isOnline(item.contactId), offline: !isOnline(item.contactId) }"
                ></span>
            </div>
            <div class="content">
                <div class="name">
                    <template v-if="editingId === item.contactId">
                        <el-input
                            v-model="editingValue"
                            size="small"
                            class="alias-input"
                            @blur="handleAliasBlur(item)"
                            @keyup.enter="handleAliasBlur(item)"
                            autofocus
                        />
                    </template>
                    <template v-else>
                        <span>{{ item.alias || item.contactNickname || '未知' }}</span>
                        &nbsp;&nbsp;
                        <el-icon color="gray" class="edit-icon" @click.stop="startEditAlias(item)">
                            <EditPen/>
                        </el-icon>
                    </template>
                </div>
                <div class="desc">{{ item.contactDescription }}</div>
            </div>
        </div>
        <div v-if="filteredList.length === 0 && searchKeyword && contactList.length > 0" class="empty-tip">未找到相关联系人</div>
    </el-scrollbar>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import defaultImg from '@/assets/default.png'
import { useOnlineUserStore } from '@/stores/OnlineUserStore';
import { useComponentStore } from '@/stores/ComponentStore';
import chat from '@/api/chat';
import { ElMessage, ElMessageBox } from 'element-plus';
const componentStore = useComponentStore()
const props = defineProps({
    contactList: Array,
})
const emit = defineEmits(['loadMoreContact'])

const OnlineUserStore = useOnlineUserStore();

const searchKeyword = ref('')
const filteredList = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return props.contactList
    return props.contactList.filter(item => {
        const name = (item.alias || item.contactNickname || '').toLowerCase()
        return name.includes(keyword)
    })
})

// 别名编辑状态
const editingId = ref(null);
const editingValue = ref('');
const submitting = ref(false);

const startEditAlias = (item) => {
    editingId.value = item.contactId;
    editingValue.value = item.alias || '';
    nextTick(() => {
        const input = document.querySelector('.alias-input .el-input__inner');
        if (input) input.focus();
    });
};

const handleAliasBlur = async (item) => {
    if (submitting.value) return;

    const newValue = editingValue.value.trim();
    const oldValue = item.alias || '';

    // 值没变，直接退出编辑
    if (newValue === oldValue) {
        editingId.value = null;
        return;
    }

    // 清空了备注，弹窗确认
    if (newValue === '') {
        try {
            await ElMessageBox.confirm('是否清除备注？清除后将显示对方昵称', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            });
        } catch {
            // 取消，回退
            editingId.value = null;
            editingValue.value = '';
            return;
        }
    }

    // 提交
    submitting.value = true;
    try {
        await chat.updateContact({ contactId: item.contactId, alias: newValue });
        item.alias = newValue;
        ElMessage.success('备注修改成功');
    } catch (error) {
        console.error('修改备注失败:', error);
        ElMessage.error('修改备注失败');
    } finally {
        editingId.value = null;
        editingValue.value = '';
        submitting.value = false;
    }
};

// 判断联系人是否在线
const isOnline = (contactId) => {
    return OnlineUserStore.onlineUsers.some(user => user.id === contactId);
}

const loadMoreContact = () => {
    emit('loadMoreContact')
}
const selectContact = (item) => {
    const user={
        id:item.contactId,
        avatar:item.contactAvatar,
        nickname:item.contactNickname,
        description:item.contactDescription,
        status:item.contactOnlineStatus,
        email:item.email,
    }
    componentStore.userInfoShow = user
}

</script>
<style lang="scss" scoped>
.scrollbar-demo-item {
    display: flex;
    align-items: center;
    padding: 15px;
    height: 70px;
    width: 97%;
    border-radius: 10px;
    background: var(--color-third);
    color: white;
    margin: 0px;
    margin-bottom: 10px;

    .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 10px;
        position: relative;

        img {
            width: 100%;
            height: 100%;
        }

        .status-dot {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid var(--color-third);

            &.online {
                background: #61ff12;
            }

            &.offline {
                background: #909399;
            }
        }
    }

    .content {
        .name {
            display: flex;
            align-items: center;
            font-size: 16px;
            font-weight: 600;

            .edit-icon {
                cursor: pointer;
                transition: color 0.2s;
                &:hover {
                    color: var(--primary-color) !important;
                }
            }

            .alias-input {
                max-width: 140px;

                :deep(.el-input__wrapper) {
                    background-color: transparent;
                    box-shadow: none;
                    padding: 0;
                    border-radius: 0;
                }

                :deep(.el-input__inner) {
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 0;
                }
            }
        }

        .desc {
            font-size: 12px;
            color: var(--text2);
        }
    }
}

.el-slider {
    margin-top: 20px;
}
.warn{
    text-align: center;
    font-size: 14px;
    color: white;
    padding: 50% 0;
}
.title{
    background-color: var(--color-secondary);
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: white;
    border-radius: 10px;
    width: 97%;
    padding:15px;
    margin-bottom: 10px;
}
.search-box {
    width: 97%;
    margin-bottom: 10px;

    :deep(.el-input__wrapper) {
        background-color: var(--color-third);
        box-shadow: none;
        border-radius: 8px;
    }
    :deep(.el-input__inner) {
        color: white;
        &::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }
    }
    :deep(.el-input__prefix .el-icon) {
        color: rgba(255, 255, 255, 0.4);
    }
    :deep(.el-input__clear) {
        color: rgba(255, 255, 255, 0.4);
    }
}
.empty-tip {
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
    padding: 30px 0;
}
</style>
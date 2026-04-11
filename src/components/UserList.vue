<template>
    <div class="user-list">
        <div class="list-title">
            在线人数：<span class="count">{{ count }}</span>
        </div>
        <div class="list-box">
            <div class="list-item" v-for="(item, index) in displayList" :key="index" @click="setUserInfo(item)">
                <img class="avatar" :src="item?.avatar" alt="">
                <div class="name">{{ item?.nickname }}</div>
                <div class="bucket owner" v-if="item?._raw?.role === 'OWNER'">
                    <span>群主</span>
                </div>
                <div class="bucket admin" v-else-if="item?._raw?.role === 'ADMIN'">
                    <span>管理员</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import avatar from '../assets/default.png'
import { useOnlineUserStore } from '../stores/OnlineUserStore'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { useComponentStore } from '@/stores/ComponentStore'
const componentStore = useComponentStore()
const OnlineUserStore = useOnlineUserStore()
const chatRoomStore = useChatRoomStore()

// 全局在线用户列表
const onlineUsers = computed(() => OnlineUserStore.onlineUsers)

// 角色排序权重：群主 > 管理员 > 成员
const roleWeight = (role) => {
    switch (role?.toLowerCase()) {
        case 'owner': return 0
        case 'admin': return 1
        default: return 2
    }
}

// 展示列表：如果选中的是群聊，则从群成员中筛选在线用户，昵称优先显示群昵称，按角色排序
const displayList = computed(() => {
    const room = chatRoomStore.currentChatRoom
    // 不是群聊或没有成员数据，显示全部在线用户
    if (!room?.members || !Array.isArray(room.members)) {
        return onlineUsers.value
    }
    // 群成员中筛选在线用户，并合并完整用户信息
    const onlineMap = new Map(onlineUsers.value.map(u => [String(u.id), u]))
    return room.members
        .filter(m => onlineMap.has(String(m.userId)))
        .map(m => {
            const onlineUser = onlineMap.get(String(m.userId))
            return {
                // 合并在线用户的完整信息（id, email, online 状态等）
                ...onlineUser,
                // 群聊优先使用群昵称和群头像
                id: m.userId,
                avatar: m.avatarUrl || onlineUser?.avatar || avatar,
                nickname: m.roomName || m.userName || onlineUser?.nickname,
                // 保留群成员原始信息（role 等）
                _raw: m
            }
        })
        .sort((a, b) => {
            const wa = roleWeight(a._raw?.role)
            const wb = roleWeight(b._raw?.role)
            if (wa !== wb) return wa - wb
            // 同角色按昵称排序
            return (a.nickname || '').localeCompare(b.nickname || '')
        })
})

const count = computed(() => displayList.value.length)
const setUserInfo = (item) => {
    componentStore.userInfoShow = item
}
</script>

<style lang="scss" scoped>
.user-list {
    border-radius: 10px;
    width: 100%;
    height: 49%;
    background: var(--color-third);
    display: flex;
    flex-direction: column;
    gap: 10px;

    .list-title {
        padding: 5px 10px;
        font-size: 16px;
        display: flex;
        align-items: center;
        color: white;
    }

    .list-box {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 10px;

        .list-item {
            display: flex;
            align-items: center;
            padding: 5px 10px;
            gap: 10px;
            border-radius: 10px;

            .avatar {
                width: 35px;
                height: 35px;
                border-radius: 50%;
            }

            .name {
                color: white;
                font-size: 14px;
                font-weight: bold;
                margin-left: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;

            }

            &:hover {
                background: var(--color-primary);
            }

            .bucket {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-left: auto;

                &.owner {
                    background-color: #f56c6c; // 红色背景
                    color: white; // 白色文字
                }

                &.admin {
                    background-color: #67c23a; // 绿色背景
                    color: white; // 白色文字
                }
            }
        }
    }
}
</style>
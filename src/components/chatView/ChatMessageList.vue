<template>
    <div class="title">消息列表</div>
    <el-scrollbar height="100%" @end-reached="loadMore">
        <div
            v-for="item in messageList"
            :key="item.id"
            class="scrollbar-demo-item"
            :class="{ active: chatRoomStore.currentChatRoom?.id === item.id }"
            @click="selectRoom(item)"
        >
            <div class="avatar">
                <img :src="item.avatarUrl || defaultImg" alt=""></img>
            </div>
            <div class="content">
                <div class="name">{{ item.name }}</div>
                <div class="desc">{{item.lastMessageSenderName}}: {{ item.lastMessageContent}}</div>
            </div>
            <span v-if="item.unreadCount > 0" class="unread-badge">
                {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
            </span>
            <div v-if="item.isPin" class="pin-icon">
                <img src="@/assets/img/taichi.png" />
            </div>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { useComponentStore } from '@/stores/ComponentStore'
import { wsClient } from '@/utils/ws'
import { ElMessage, ElMessageBox } from 'element-plus'
import defaultImg from '@/assets/default.png'
const componentStore = useComponentStore()
const chatRoomStore = useChatRoomStore()
const props = defineProps({
    messageList: Array,
})




const selectRoom = async (item) => {
    componentStore.rightTab = 'default'
    if(chatRoomStore.currentChatRoom?.id === item.id) {
        console.log('[selectRoom] 重复点击，退出')
        return
    }
    const oldRoomId = chatRoomStore.currentChatRoom?.id
    if (oldRoomId) {
        // 上报旧房间的已读位置（先上报，再清空）
        chatRoomStore.reportRead(oldRoomId)
    }
    // 清空消息列表并设置当前房间
    chatRoomStore.currentMessageList = []
    chatRoomStore.currentChatRoom = item;
    // 进入新房间，本地立即清零未读数
    item.unreadCount = 0
    
    // 先获取消息列表
    await chatRoomStore.getCurrentMessageList(50, null);
    // 等待消息列表加载完成后再上报
    await scrollToBottom()
    
    // 确保有消息后再上报已读
    if (chatRoomStore.currentMessageList.length > 0) {
        chatRoomStore.reportRead(item.id)
    }

    
}
const emit = defineEmits(['scrollToBottom', 'loadMore'])
const scrollToBottom = async() => {
     emit('scrollToBottom')
}
const loadMore = () => {
    emit('loadMore')
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
    position: relative;

    &.active {
        background: var(--selected);
    }

    .pin-icon {
        position: absolute;
        top: 5px;
        right: 5px;
        img{
            width: 20px;
            height: 20px;
        }
    }

    .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 10px;

        img {
            width: 100%;
            height: 100%;
        }
    }

    .content {
        .name {
            font-size: 16px;
            font-weight: 600;
        }

        .desc {
            font-size: 12px;
            color: var(--text2);
        }
    }

    .unread-badge {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        min-width: 18px;
        height: 18px;
        line-height: 18px;
        text-align: center;
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        background: #f56c6c;
        border-radius: 9px;
        padding: 0 5px;
        z-index: 1;
    }
}

.el-slider {
    margin-top: 20px;
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
</style>

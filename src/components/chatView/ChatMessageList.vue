<template>
    <el-scrollbar height="100%" @end-reached="loadMore">
        <div v-for="item in messageList" :key="item.id" class="scrollbar-demo-item" @click="selectRoom(item)">
            <div class="avatar">
                <img :src="item.avatarUrl" alt=""></img>
            </div>
            <div class="content">
                <div class="name">{{ item.name }}</div>
                <div class="desc">{{ item.description }}</div>
            </div>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { ref } from 'vue'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { wsClient } from '@/utils/ws'
const chatRoomStore = useChatRoomStore()
const props = defineProps({
    messageList: Array,
})
const selectRoom = async (item) => {
    chatRoomStore.currentMessageList = []
    const oldRoomId = chatRoomStore.currentChatRoom?.id
    if (oldRoomId) {
        wsClient.leaveGroup(oldRoomId)
    }
    chatRoomStore.currentChatRoom = item;
    await chatRoomStore.getCurrentMessageList(50, null);
    await scrollToBottom()
    if (item?.id) {
        wsClient.joinGroup(item.id)
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
}

.el-slider {
    margin-top: 20px;
}
</style>
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
                <div class="desc">{{item.lastMessageSenderName}}: {{ formatLastContent(item.lastMessageContent, item.lastMessageContentType) }}</div>
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

/** 格式化聊天室列表中的最后一条消息内容 */
const formatLastContent = (content, contentType) => {
    if (!content) return ''
    // 如果有 contentType 字段，直接按类型映射
    if (contentType && contentType !== 'TEXT') {
        const typeLabels = {
            IMAGE: '[图片]',
            VIDEO: '[视频]',
            PDF: '[PDF]',
            WORD: '[文档]',
            EXCEL: '[表格]',
            ZIP: '[压缩包]',
            FILE: '[文件]',
        }
        return typeLabels[contentType] || '[文件]'
    }
    // 兜底：如果内容是 JSON 字符串，尝试解析并识别类型
    if (typeof content === 'string' && content.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(content)
            if (parsed.url) {
                // 通过 URL 后缀推断类型
                const url = parsed.url.toLowerCase()
                if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)($|\?)/.test(url)) return '[图片]'
                if (/\.(mp4|avi|mov|wmv|flv|mkv|webm)($|\?)/.test(url)) return '[视频]'
                if (/\.(pdf)($|\?)/.test(url)) return '[PDF]'
                if (/\.(doc|docx)($|\?)/.test(url)) return '[文档]'
                if (/\.(xls|xlsx|csv)($|\?)/.test(url)) return '[表格]'
                if (/\.(zip|rar|7z|tar|gz)($|\?)/.test(url)) return '[压缩包]'
                return '[文件]'
            }
        } catch { /* 解析失败，返回原始内容 */ }
    }
    return content
}




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

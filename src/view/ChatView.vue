<template>
    <div class="ChatView">
        <div class="ChatView-left">
            <chat-message-list :message-list="messageList" @scroll-to-bottom="scrollToBottom" @load-more="loadMore"
                v-if="sideTab === 'message'" />
            <chat-contact-list v-else :contact-list="contactList" />
        </div>
        <div class="ChatView-right">
            <div class="ChatRoom" v-if="chatRoomStore.currentChatRoom != null && accountStore.isLogin">
                <div class="RoomHeader">
                    <div class="RoomTitle">{{ currentChatRoom?.name || '聊天室' }}</div>
                    <div class="funBox">
                        <span class="iconfont icon-gengduo" @click="openGroupManageDrawer"></span>
                    </div>
                </div>

                <el-scrollbar class="RoomContent" ref="roomContentRef" @end-reached="handleEndReached">
                    <div v-for="item in currentMessageList" :key="item.id" class="message-item"
                        :class="{ 'is-self': item.isSelf }">
                        <div class="avatar">
                            <img :src="item.senderAvatar || avatars" alt=""
                                @error="(e) => e.target.src = avatars"></img>
                        </div>
                        <div class="box">
                            <div class="content">
                                <div class="name">{{ item.senderName }}</div>
                                <div class="bubble">{{ item.content }}</div>
                            </div>
                            <div class="time">{{ item.sentAt }}</div>
                        </div>
                    </div>
                </el-scrollbar>
                <div class="RoomInput">
                    <div class="muted-notice" v-if="isCurrentUserMuted">
                        <el-icon :size="16"><WarningFilled /></el-icon>
                        <span>你已被管理员禁言，暂时无法发送消息</span>
                    </div>
                    <template v-else>
                    <div class="input-box">
                        <textarea ref="textareaRef" v-model="message" placeholder="请输入消息..."
                            @input="adjustTextareaHeight" @keydown.enter.exact.prevent="sendMessage"
                            @keydown.shift.enter="insertNewline" class="auto-resize-textarea" />
                        <button @click="sendMessage" class="send-button">发送</button>
                    </div>
                    
                    <!-- 功能图标栏 -->
                    <div class="icon-bar">
                        <div class="icon-item" @click="handleVoice">
                            <div class="icon-placeholder voice-icon"></div>
                        </div>

                        <div class="icon-item" @click="handleImage">
                            <div class="icon-placeholder image-icon"></div>
                        </div>

                        <div class="icon-item" @click="handleCamera">
                            <div class="icon-placeholder camera-icon"></div>
                        </div>

                        <div class="icon-item" @click="handleLocation">
                            <div class="icon-placeholder location-icon"></div>
                        </div>
                    </div>
                    </template>
                </div>
            </div>
            <div class="welcome" v-else>
                <div class="welcome-content">
                    <h1 class="welcome-title">欢迎使用聊天室</h1>
                    <p class="welcome-subtitle">选择左侧的聊天室开始对话</p>
                    <div class="welcome-tips">
                        <div class="tip-item">
                            <span class="tip-icon">👈</span>
                            <span>聊天室查看消息</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-icon">📨</span>
                            <span>实时接收新消息</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-icon">👥</span>
                            <span>与群组成员畅聊</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import avatars from '@/assets/default.png'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { useAccountStore } from '@/stores/AccountStore'
import { useComponentStore } from '@/stores/ComponentStore'
import { useContactStore } from '@/stores/ContactStore'
import { wsClient } from '@/utils/ws';
import ChatMessageList from '@/components/chatView/ChatMessageList.vue'
import ChatContactList from '@/components/chatView/ChatContactList.vue'


const contactStore = useContactStore();
const chatRoomStore = useChatRoomStore();
const accountStore = useAccountStore();
const componentStore = useComponentStore();
const message = ref('')
const sending = ref(false)
const roomContentRef = ref(null)
let offWsMessage = null

const parseTimeToMs = (value) => {
    if (value === null || value === undefined || value === '') return null
    if (value instanceof Date) {
        const ms = value.getTime()
        return Number.isFinite(ms) ? ms : null
    }
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null
        return value < 1e12 ? value * 1000 : value
    }
    const text = String(value).trim()
    if (!text) return null
    if (/^\d+$/.test(text)) {
        const num = Number(text)
        if (!Number.isFinite(num)) return null
        return text.length <= 10 ? num * 1000 : num
    }
    const normalized = text.includes('T') ? text : text.replace(' ', 'T')
    const ms = Date.parse(normalized)
    return Number.isFinite(ms) ? ms : null
}

const formatTime = (value) => {
    const ms = parseTimeToMs(value)
    if (ms === null) return '--:--:--'
    const d = new Date(ms)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const sideTab = computed(() => componentStore.sideTab)
const messageList = computed(() => {
    const list = chatRoomStore.chatRoomList.filter(item => item.isActive == 1)|| [];
    // 置顶的始终在最前面，同为置顶时id小的排前面
    return [...list].sort((a, b) => {
        // 先按置顶状态排序
        if (a.isPin !== b.isPin) {
            return b.isPin - a.isPin; // isPin 为 1 的排在前面
        }
        // 置顶状态下，按id升序
        if (a.isPin) {
            return a.id - b.id;
        }
        // 非置顶状态，按最新消息时间倒序
        return (parseTimeToMs(b.lastMessageTime) || 0) - (parseTimeToMs(a.lastMessageTime) || 0);
    });
})
const contactList = computed(() => {
    return contactStore.contactList || [];
})
const currentUserId = computed(() => {
    return accountStore.user?.id || null;
})
const currentUserName = computed(() => {
    return accountStore.user?.nickname || '';
})
const currentUserAvatar = computed(() => {
    return accountStore.user?.avatar || avatars;
})
const currentMessageList = computed(() => {
    const list = chatRoomStore.currentMessageList || [];
    const sortedList = [...list].sort((a, b) => {
        return (parseTimeToMs(a.sentAt) || 0) - (parseTimeToMs(b.sentAt) || 0);
    });
    return sortedList.map(item => {
        const isSelf = currentUserId.value !== null && String(item.senderId) === String(currentUserId.value)
        const formattedTime = formatTime(item.sentAt);

        // 确保每条消息都有 id 字段
        const messageId = item.id || item.messageId;

        return {
            ...item,
            id: messageId,
            messageId: messageId, // 保留 messageId 字段以便调试
            senderName: item.senderName || (isSelf ? currentUserName.value : ''),
            senderAvatar: item.senderAvatar || (isSelf ? currentUserAvatar.value : '') || avatars,
            isSelf,
            sentAt: formattedTime
        }
    })
})
const buildMessageItem = (source) => {
    const isSelf = currentUserId.value !== null && String(source.senderId) === String(currentUserId.value)
     const messageId = source.messageId || source.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
     return {
        id: messageId,
        messageId: messageId,  // 保留原始字段名
        chatRoomId: source.chatRoomId,
        senderId: source.senderId,
        senderName: source.senderName || (isSelf ? currentUserName.value : ''),
        senderAvatar: source.senderAvatar || (isSelf ? currentUserAvatar.value : '') || avatars,
        content: source.content,
        contentType: source.contentType,
        sentAt: source.sentAt
    }
}
const scrollToBottom = async () => {
    await nextTick();
    if (roomContentRef.value?.wrapRef) {
        roomContentRef.value.wrapRef.scrollTop = roomContentRef.value.wrapRef.scrollHeight;
    }
};
const loadMore = () => { }
const joinAllRooms = () => {
    const rooms = chatRoomStore.chatRoomList || []
    rooms.forEach((room) => {
        if (room?.id) {
            wsClient.joinGroup(room.id)
        }
    })
}
const handleWsMessage = (msg) => {
    if (msg?.type !== 'GROUP') return
    const source = msg.data || msg
    const currentRoomId = chatRoomStore.currentChatRoom?.id
    if (!source?.chatRoomId) return

    console.log('[handleWsMessage] 收到消息，房间ID:', source.chatRoomId, '当前房间ID:', currentRoomId);

    // 更新聊天室列表中该群的最新消息
    const room = chatRoomStore.chatRoomList.find(
        r => String(r.id) === String(source.chatRoomId)
    )
    if (room) {
        room.lastMessageContent = source.content
        room.lastMessageSenderName = source.senderName || room.lastMessageSenderName
        room.lastMessageTime = source.sentAt
    } else {
        console.warn('[handleWsMessage] 找不到房间:', source.chatRoomId);
    }

    if (String(source.chatRoomId) === String(currentRoomId)) {
        // 当前群 → 追加消息
        if (!Array.isArray(chatRoomStore.currentMessageList)) {
            chatRoomStore.currentMessageList = []
        }
        chatRoomStore.currentMessageList.push(buildMessageItem(source))
        console.log('[handleWsMessage] 当前房间收到消息，追加到列表');
        // 顺手上报已读（防抖）
        chatRoomStore.reportCurrentRead()
    } else {
        // 非当前群 → 本地未读数 +1
        if (room) {
            room.unreadCount = (room.unreadCount || 0) + 1
            console.log('[handleWsMessage] 非当前房间收到消息，未读数+1，当前未读:', room.unreadCount);
        } else {
            console.warn('[handleWsMessage] 无法更新未读数，找不到房间');
        }
    }
}
onMounted(async () => {
    await chatRoomStore.getAllRoom();
    joinAllRooms()
    await contactStore.getAllContact();
    if (chatRoomStore.currentChatRoom?.id) {
        await chatRoomStore.getCurrentMessageList();
        // wsClient.joinGroup(chatRoomStore.currentChatRoom.id)
        await scrollToBottom()
    }
    offWsMessage = wsClient.onMessage(handleWsMessage)
})
onUnmounted(() => {
    if (offWsMessage) {
        offWsMessage()
        offWsMessage = null
    }
    if (chatRoomStore.currentChatRoom?.id) {
        const rooms = chatRoomStore.chatRoomList || []
        rooms.forEach((room) => {
            if (room?.id) {
                wsClient.leaveGroup(room.id)
            }
        })
    }
    chatRoomStore.currentMessageList = []
})

watch(
    () => (chatRoomStore.chatRoomList || []).map(room => room?.id).join(','),
    () => {
        joinAllRooms()
    }
)

const currentChatRoom = computed(() => {
    return chatRoomStore.currentChatRoom;
})

const isCurrentUserMuted = computed(() => {
    const userId = accountStore.user?.id;
    const members = chatRoomStore.currentChatRoom?.members;
    if (!members || !userId) return false;
    const member = members.find(m => String(m.userId) === String(userId));
    return member?.isMuted === 1;
})

const sendMessage = async () => {
    const content = message.value.trim()
    if (!content) return
    if (!chatRoomStore.currentChatRoom?.id) {
        ElMessage.warning('请先选择聊天室')
        return
    }
    if (!wsClient.ws || wsClient.ws.readyState !== WebSocket.OPEN) {
        ElMessage.error('WebSocket 未连接')
        return
    }
    if (sending.value) return
    sending.value = true
    try {
        wsClient.sendGroupMessage(
            chatRoomStore.currentChatRoom.id,
            content,
            'TEXT',
            currentUserId.value,
            currentUserName.value,
            currentUserAvatar.value,
            Date.now()
        )
        message.value = ''
    } finally {
        sending.value = false
    }
}
watch(
    () => currentMessageList.value.length,
    async () => {
        await scrollToBottom()
    }
)
const isLoadingMore = ref(false);
const handleEndReached = async (direction) => {
    if (direction === 'top' && !isLoadingMore.value) {
        const rawMessages = chatRoomStore.currentMessageList;
        if (!rawMessages || rawMessages.length === 0) return;

        const earliestSentAt = rawMessages[0]?.sentAt;
        if (!earliestSentAt) return;

        isLoadingMore.value = true;
        try {
            const wrap = roomContentRef.value?.wrapRef;
            if (!wrap) return;

            const oldScrollHeight = wrap.scrollHeight;
            await chatRoomStore.getCurrentMessageList(50, earliestSentAt);
            await nextTick();

            // 恢复滚动位置
            wrap.scrollTop = wrap.scrollHeight - oldScrollHeight;
        } finally {
            isLoadingMore.value = false;
        }
    }
};
const openGroupManageDrawer = () => {
    componentStore.rightTab = 'groupManage';
};
</script>

<style lang="scss" scoped>
.ChatView {
    height: 100%;
    width: 100%;
    border-radius: 10px;
    display: flex;
    // background-color: var(--color-secondary);
}

.ChatView-left {
    width: 250px;
    height: 100%;
}

.ChatView-right {
    flex: 1;

    .welcome {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-third);
        border-radius: 10px;

        .welcome-content {
            text-align: center;
            padding: 40px;
            max-width: 500px;

            .welcome-icon {
                font-size: 80px;
                margin-bottom: 20px;
                animation: float 3s ease-in-out infinite;
            }

            .welcome-title {
                font-size: 32px;
                font-weight: 600;
                color: white;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .welcome-subtitle {
                font-size: 16px;
                color: var(--text2);
                margin-bottom: 40px;
                line-height: 1.5;
            }

            .welcome-tips {
                display: flex;
                flex-direction: column;
                gap: 15px;
                align-items: center;

                .tip-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 20px;
                    background: rgba(100, 61, 61, 0.1);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    transition: transform 0.3s ease, background 0.3s ease;

                    &:hover {
                        transform: translateX(5px);
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .tip-icon {
                        font-size: 18px;
                    }
                }
            }
        }
    }

    .ChatRoom {
        border-radius: 10px;
        background-color: var(--color-third);
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;

        .RoomHeader {
            display: flex;
            height: 50px;
            background-color: var(--color-secondary);
            border-radius: 10px 10px 0px 0px;
            font-size: large;
            padding: 10px 20px;
            color: white;
            justify-content: space-between;
            .RoomTitle {
                color: white;
            }
            .funBox{
                display: flex;
                align-items: center;
                gap: 10px;
                .iconfont{
                    font-size: 24px;
                    font-weight: bold;
                }
            }
        }
    }

    .RoomContent {
        flex: 1;
        padding: 16px 18px;
        overflow-y: auto;

        .message-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 14px;
            gap: 10px;

            .avatar {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .box {
                display: flex;
                flex-direction: column;
                max-width: calc(100% - 48px);
                /* 减去头像宽度和间距 */
                flex: 1;
                /* 添加这个属性 */

                .content {
                    max-width: 72%;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: flex-start;

                    /* 新增样式，修复换行问题 */
                    min-width: 0;
                    /* 重要：允许内容收缩 */
                    width: fit-content;
                    /* 根据内容自适应宽度 */
                    max-width: min(72%, 600px);

                    /* 添加最大像素限制 */
                    .name {
                        font-size: 12px;
                        color: #7a889d;
                        line-height: 1;
                        padding: 0 4px;
                    }

                    .bubble {
                        /* 新增样式 */
                        max-width: 100%;
                        /* 确保气泡不超过容器 */
                        word-break: break-word;
                        /* 中文换行优化 */
                        hyphens: auto;
                        /* 自动连字符 */

                        /* 原有样式 */
                        font-size: 14px;
                        line-height: 1.5;
                        color: #1f2a37;
                        background: #ffffff;
                        border: 1px solid #e8eef5;
                        border-radius: 6px 16px 16px 16px;
                        padding: 10px 12px;
                        box-shadow: 0 6px 16px rgba(31, 42, 55, 0.06);
                        overflow-wrap: break-word;
                        white-space: pre-wrap;
                    }
                }
            }
        }

        .message-item.is-self {
            flex-direction: row-reverse;

            .box {
                align-items: flex-end;
                max-width: calc(100% - 48px);

                .content {
                    align-items: flex-end;
                    /* 右侧消息的容器也应用相同修复 */
                    min-width: 0;
                    width: fit-content;
                    max-width: min(72%, 600px);


                    .name {
                        text-align: right;
                    }

                    .bubble {
                        /* 右侧消息气泡样式调整 */
                        background: #0099ff;
                        color: #ffffff;
                        border-color: #0099ff;
                        border-radius: 16px 6px 16px 16px;
                        box-shadow: 0 8px 18px rgba(0, 153, 255, 0.28);

                        /* 同样应用最大宽度限制 */
                        max-width: 100%;
                    }
                }
            }
        }
    }

    .RoomInput {
        height: auto;
        display: flex;
        flex-direction: column;
        padding: 15px;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);

        .muted-notice {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
            background-color: #fef0f0;
            border: 1px solid #fde2e2;
            border-radius: 8px;
            color: #f56c6c;
            font-size: 13px;
        }

        .input-box {
            width: 100%;
            display: flex;

            .auto-resize-textarea {
                flex: 1;
                padding: 8px 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                transition: height 0.2s ease;
                box-sizing: border-box;

                &:focus {
                    outline: none;
                    border-color: #000000;
                    box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.1);
                }
            }

            .send-button {
                width: 80px;
                margin-left: 10px;
                padding: 10px 20px;
                background-color: #409eff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;

                &:hover {
                    background-color: #66b1ff;
                }
            }
        }
    }


    .icon-bar {
        width: 100%;
        display: flex;
        gap: 12px;
        justify-content: space-evenly;
        align-items: center;

        .icon-item {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;

            &:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
        }

        .icon-placeholder {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #ccc;
        }

        .voice-icon {
            background-color: #f0f0f0;
        }

        .image-icon {
            background-color: #e0e0e0;
        }

        .camera-icon {
            background-color: #d0d0d0;
        }

        .location-icon {
            background-color: #c0c0c0;
        }

        .emoji-icon {
            background-color: #b0b0b0;
        }

        .more-icon {
            background-color: #a0a0a0;
        }
    }
}

// 欢迎页面动画
@keyframes float {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }

    100% {
        transform: translateY(0px);
    }
}
</style>

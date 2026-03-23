<template>
    <div class="ChatView">
        <div class="ChatView-left">
            <el-scrollbar height="100%" @end-reached="loadMore">
                <div v-for="item in messageList" :key="item" class="scrollbar-demo-item" @click="selectRoom(item)">
                    <div class="avatar">
                        <img :src="item.avatarUrl" alt=""></img>
                    </div>
                    <div class="content">
                        <div class="name">{{ item.name }}</div>
                        <div class="desc">{{ item.description }}</div>
                    </div>
                </div>
            </el-scrollbar>
        </div>
        <div class="ChatView-right">
            <div class="ChatRoom">
                <div class="RoomTitle">{{ currentChatRoom?.name || '聊天室' }}</div>
                <div class="RoomContent" ref="roomContentRef">
                    <div v-for="item in currentMessageList" :key="item.id" class="message-item" :class="{ 'is-self': item.isSelf }">
                        <div class="avatar">
                            <img :src="item.senderAvatar || avatars" alt="" @error="(e) => e.target.src = avatars"></img>
                        </div>
                        <div class="content">
                            <div class="name">{{ item.senderName }}</div>
                            <div class="bubble">{{ item.content }}</div>
                        </div>
                    </div>
                </div>
                <div class="RoomInput">
                    <div class="input-box">
                        <textarea ref="textareaRef" v-model="message"
                            placeholder="请输入消息..." @input="adjustTextareaHeight"
                            @keydown.enter.exact.prevent="sendMessage" @keydown.shift.enter="insertNewline"
                            class="auto-resize-textarea" />
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
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import avatars from '@/assets/default.png'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { useAccountStore } from '@/stores/AccountStore'
import { wsClient } from '@/utils/ws';
const chatRoomStore = useChatRoomStore();
const accountStore = useAccountStore();

const message = ref('')
const sending = ref(false)
const roomContentRef = ref(null)
let offWsMessage = null
const messageList = computed(() => {
    return chatRoomStore.chatRoomList || [];
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
    return list.map(item => {
        const isSelf = currentUserId.value !== null && String(item.senderId) === String(currentUserId.value)
        return {
            ...item,
            senderName: item.senderName || (isSelf ? currentUserName.value : ''),
            senderAvatar: item.senderAvatar || (isSelf ? currentUserAvatar.value : '') || avatars,
            isSelf
        }
    })
})
const buildMessageItem = (source) => {
    const isSelf = currentUserId.value !== null && String(source.senderId) === String(currentUserId.value)
    return {
        id: source.id,
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
    await nextTick()
    const el = roomContentRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
}
const handleWsMessage = (msg) => {
    if (msg?.type !== 'GROUP') return
    const source = msg.data || msg
    const currentRoomId = chatRoomStore.currentChatRoom?.id
    if (!source?.chatRoomId || !currentRoomId) return
    if (String(source.chatRoomId) !== String(currentRoomId)) return
    if (!Array.isArray(chatRoomStore.currentMessageList)) {
        chatRoomStore.currentMessageList = []
    }
    chatRoomStore.currentMessageList.push(buildMessageItem(source))
}
onMounted(async()=>{
   await chatRoomStore.getAllRoom();
   if (chatRoomStore.currentChatRoom?.id) {
      await chatRoomStore.getCurrentMessageList();
      wsClient.joinGroup(chatRoomStore.currentChatRoom.id)
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
        wsClient.leaveGroup(chatRoomStore.currentChatRoom.id)
    }
})
const loadMore = () => {

}
const currentChatRoom = computed(()=>{
    return chatRoomStore.currentChatRoom;
})
const selectRoom = async (item) => {
    const oldRoomId = chatRoomStore.currentChatRoom?.id
    if (oldRoomId) {
        wsClient.leaveGroup(oldRoomId)
    }
    chatRoomStore.currentChatRoom = item;
    await chatRoomStore.getCurrentMessageList();
    await scrollToBottom()
    if (item?.id) {
        wsClient.joinGroup(item.id)
    }
}
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
      currentUserAvatar.value
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
}

.ChatView-right {
    flex: 1;

    .ChatRoom {
        border-radius: 10px;
        background-color: var(--color-third);
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;

        .RoomTitle {
            height: 50px;
            background-color: var(--color-secondary);
            border-radius: 10px 10px 0px 0px;
            font-size: large;
            padding: 10px;
            color: white;
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

            .content {
                max-width: 72%;
                display: flex;
                flex-direction: column;
                gap: 4px;

                .name {
                    font-size: 12px;
                    color: #7a889d;
                    line-height: 1;
                    padding: 0 4px;
                }

                .bubble {
                    font-size: 14px;
                    line-height: 1.5;
                    color: #1f2a37;
                    background: #ffffff;
                    border: 1px solid #e8eef5;
                    border-radius: 6px 16px 16px 16px;
                    padding: 10px 12px;
                    box-shadow: 0 6px 16px rgba(31, 42, 55, 0.06);
                    word-break: break-word;
                    white-space: pre-wrap;
                }
            }
        }

        .message-item.is-self {
            flex-direction: row-reverse;

            .content {
                align-items: flex-end;

                .name {
                    text-align: right;
                }

                .bubble {
                    background: #0099ff;
                    color: #ffffff;
                    border-color: #0099ff;
                    border-radius: 16px 6px 16px 16px;
                    box-shadow: 0 8px 18px rgba(0, 153, 255, 0.28);
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
</style>
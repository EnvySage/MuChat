<template>
    <div class="ChatView">
        <div class="ChatView-left">
            <chat-message-list :message-list="messageList" @scroll-to-bottom="scrollToBottom" @load-more="loadMore"
                v-if="sideTab === 'message'" />
            <chat-contact-list v-else-if="sideTab === 'contact'" :contact-list="contactList" />
            <NoticeList v-else @select="activeNoticeCat = $event" />
        </div>
        <div class="ChatView-right">
            <div class="ChatRoom" v-if="chatRoomStore.currentChatRoom != null && accountStore.isLogin && sideTab != 'notice'"
                @click="showEmoji = false">
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
                                <!-- 文本消息 -->
                                <div v-if="!item.contentType || item.contentType === 'TEXT'" class="bubble">{{
                                    item.content }}</div>
                                <!-- 图片消息 -->
                                <div v-else-if="item.contentType === 'IMAGE'" class="bubble bubble-image"
                                    @click="handleImagePreview(item)">
                                    <img :src="parseFileContent(item.content)?.url" alt="图片" class="chat-image"
                                        loading="lazy" @error="(e) => e.target.src = avatars" />
                                </div>
                                <!-- 视频消息 -->
                                <div v-else-if="item.contentType === 'VIDEO'" class="bubble bubble-file"
                                    @click="handleFileClick(item)">
                                    <div class="file-info">
                                        <div class="file-icon video-icon"></div>
                                        <div class="file-detail">
                                            <div class="file-name">{{ item.fileName || '视频' }}</div>
                                            <div class="file-size">{{ formatFileSize(item.fileSize) }}</div>
                                        </div>
                                    </div>
                                </div>
                                <!-- 其他文件消息 (PDF/WORD/EXCEL/ZIP/FILE) -->
                                <div v-else class="bubble bubble-file" @click="handleFileClick(item)">
                                    <div class="file-info">
                                        <div class="file-icon" :class="getFileIconClass(item.contentType)"></div>
                                        <div class="file-detail">
                                            <div class="file-name">{{ item.fileName || '文件' }}</div>
                                            <div class="file-size">{{ formatFileSize(item.fileSize) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="time">{{ item.sentAt }}</div>
                        </div>
                    </div>
                </el-scrollbar>
                <div class="RoomInput">
                    <div class="muted-notice" v-if="isCurrentUserMuted">
                        <el-icon :size="16">
                            <WarningFilled />
                        </el-icon>
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
                            <div class="icon-item" @click.stop="showEmoji = !showEmoji">
                                <span class="emoji-icon">😊</span>
                            </div>
                            <EmojiPicker v-if="showEmoji" @select="onSelectEmoji" :hide-search="false"
                                :disable-skin-tones="true" class="emoji-picker-popup" @click.stop />

                            <div class="icon-item" @click="triggerFileUpload">
                                <svg t="1776064481075" class="icon" viewBox="0 0 1024 1024" version="1.1"
                                    xmlns="http://www.w3.org/2000/svg" p-id="6582" width="200" height="200">
                                    <path
                                        d="M490.23 221.699l-47.125-49.852c-13.802-14.603-32.937-22.868-52.943-22.868H186.101c-40.402 0-73.153 33.035-73.153 73.786v548.08c0 40.75 32.751 73.786 73.153 73.786h653.697c40.398 0 73.15-33.037 73.15-73.786V318.351c0-40.75-32.751-73.784-73.15-73.784H543.174c-20.006 0-39.137-8.266-52.944-22.868z"
                                        fill="#FFA820" p-id="6583"></path>
                                    <path
                                        d="M194.029 148.979h-7.927c-40.402 0-73.153 33.035-73.153 73.786v14.772a447.71 447.71 0 0 1 81.08-88.558zM912.948 318.351c0-37.143-27.214-67.863-62.623-73.013 29.014 43.751 50.506 92.923 62.623 145.675v-72.662zM912.948 770.845V591.186c-23.546 102.506-82.474 191.504-163.244 253.445h90.094c40.399 0 73.15-33.036 73.15-73.786zM112.948 744.662v26.183c0 40.75 32.751 73.786 73.153 73.786h22.181a447.815 447.815 0 0 1-95.334-99.969z"
                                        fill="#FEAC33" p-id="6584"></path>
                                    <path
                                        d="M249.061 148.979h-55.033a447.77 447.77 0 0 0-81.08 88.558v67.603c30.328-63.67 77.652-117.683 136.113-156.161zM112.948 635.199v109.464a447.814 447.814 0 0 0 95.334 99.969H373.53c-115.336-26.537-210.833-104.989-260.582-209.433zM912.948 591.186V391.013c-12.117-52.753-33.609-101.924-62.623-145.675a73.1 73.1 0 0 0-10.527-0.772h-68.696c46.026 63.352 73.174 141.306 73.174 225.603 0 182.464-127.183 335.221-297.734 374.462h203.162c80.77-61.941 139.699-150.939 163.244-253.445z"
                                        fill="#FEB133" p-id="6585"></path>
                                    <path
                                        d="M844.277 470.169c0-84.297-27.148-162.251-73.174-225.603h-79.854c45.655 55.738 73.06 127.002 73.06 204.672 0 178.515-144.715 323.23-323.23 323.23S117.85 627.753 117.85 449.238c0-136.162 84.199-252.646 203.366-300.26h-72.154C190.6 187.457 143.276 241.47 112.948 305.14v330.058c49.749 104.444 145.246 182.896 260.581 209.432h173.013c170.552-39.239 297.735-191.997 297.735-374.461z"
                                        fill="#FEB633" p-id="6586"></path>
                                    <path
                                        d="M117.849 449.239c0 178.515 144.715 323.23 323.229 323.23s323.23-144.715 323.23-323.23c0-77.67-27.405-148.935-73.06-204.672h-82.076c46.483 47.315 75.167 112.174 75.167 183.742 0 144.819-117.399 262.219-262.219 262.219s-262.218-117.4-262.218-262.219 117.4-262.219 262.219-262.219c5.179 0 10.318 0.167 15.423 0.463-13.161-11.289-29.94-17.575-47.382-17.575h-68.947c-119.166 47.615-203.366 164.1-203.366 300.261z"
                                        fill="#FFBC34" p-id="6587"></path>
                                    <path
                                        d="M159.902 428.309c0 144.819 117.399 262.219 262.219 262.219s262.219-117.4 262.219-262.219c0-71.568-28.684-136.427-75.167-183.742h-65.998c-20.007 0-39.137-8.266-52.944-22.868l-47.125-49.852a73.533 73.533 0 0 0-5.56-5.293 266.288 266.288 0 0 0-15.423-0.463c-144.821-0.001-262.221 117.399-262.221 262.218z m444.469-20.93c0 111.124-90.084 201.208-201.208 201.208s-201.208-90.084-201.208-201.208 90.084-201.208 201.208-201.208 201.208 90.084 201.208 201.208z"
                                        fill="#FFC134" p-id="6588"></path>
                                    <path
                                        d="M201.956 407.379c0 111.124 90.084 201.208 201.208 201.208s201.208-90.084 201.208-201.208-90.084-201.208-201.208-201.208-201.208 90.084-201.208 201.208z m322.447-20.931c0 77.429-62.768 140.197-140.197 140.197s-140.197-62.768-140.197-140.197 62.768-140.197 140.197-140.197 140.197 62.769 140.197 140.197z"
                                        fill="#FFC634" p-id="6589"></path>
                                    <path
                                        d="M384.206 386.448m-140.197 0a140.197 140.197 0 1 0 280.394 0 140.197 140.197 0 1 0-280.394 0Z"
                                        fill="#FFCB34" p-id="6590"></path>
                                    <path
                                        d="M390.162 166.979c14.982 0 29.511 6.281 39.862 17.233l47.127 49.854c17.127 18.113 41.191 28.501 66.023 28.501h296.624c30.41 0 55.15 25.025 55.15 55.784v452.494c0 30.761-24.74 55.786-55.15 55.786H186.101c-30.411 0-55.153-25.026-55.153-55.786v-548.08c0-30.761 24.742-55.786 55.153-55.786h204.061m0-18H186.101c-40.402 0-73.153 33.035-73.153 73.786v548.08c0 40.75 32.751 73.786 73.153 73.786h653.697c40.398 0 73.15-33.037 73.15-73.786V318.351c0-40.75-32.751-73.784-73.15-73.784H543.175c-20.007 0-39.137-8.266-52.944-22.868l-47.125-49.852c-13.803-14.604-32.938-22.868-52.944-22.868z"
                                        fill="#FFA820" p-id="6591"></path>
                                    <path
                                        d="M130.935 353.465h556.523c19.21 0 34.781 15.572 34.781 34.783v139.13c0 19.209-15.57 34.783-34.781 34.783H130.935V353.465z"
                                        fill="#FFE3B4" p-id="6592"></path>
                                    <path
                                        d="M379.302 226.171h-124.12c-9.941 0-18-8.059-18-18s8.059-18 18-18h124.12c9.941 0 18 8.059 18 18s-8.059 18-18 18z"
                                        fill="#FFFFFF" p-id="6593"></path>
                                    <path
                                        d="M195.246 226.171H184.7c-9.941 0-18-8.059-18-18s8.059-18 18-18h10.545c9.941 0 18 8.059 18 18s-8.058 18-17.999 18z"
                                        fill="#FFFFFF" p-id="6594"></path>
                                </svg>
                            </div>
                            <input ref="fileInputRef" type="file" class="hidden-file-input"
                                @change="handleFileSelected" />

                        </div>
                    </template>
                </div>
            </div>
            <div class="notice-detail" v-else-if="sideTab === 'notice'">
                <div class="notice-detail-header">
                    <span>{{ noticeCategoryName }}</span>
                    <span class="read-all-btn" @click="noticeReadAll">全部已读</span>
                </div>
                <el-scrollbar height="calc(100% - 46px)">
                    <div v-if="noticeDetailList.length === 0" class="notice-empty">暂无通知</div>
                    <div v-for="item in noticeDetailList" :key="item.id" class="notice-detail-item"
                        @click="noticeStore.readNotice(item.id)">
                        <div class="notice-avatar">
                            <img :src="item.senderAvatar || avatars" alt="" @error="(e) => e.target.src = avatars" />
                        </div>
                        <div class="notice-info">
                            <div class="notice-row">
                                <span class="notice-name">{{ item.title }}</span>
                                <span class="notice-status" :data-status="item.status">{{ item.statusDesc }}</span>
                            </div>
                            <div class="notice-row" v-if="item.content">
                                <span class="notice-desc">{{ item.content }}</span>
                            </div>
                            <div class="notice-row">
                                <span class="notice-time">{{ formatNoticeTime(item.createdAt) }}</span>
                                <span v-if="isExpired(item)" class="notice-expired">已过期</span>
                            </div>
                            <div class="notice-actions" v-if="canHandle(item)">
                                <button class="btn-accept" @click.stop="handleAccept(item)">同意</button>
                                <button class="btn-reject" @click.stop="handleReject(item)">拒绝</button>
                            </div>
                        </div>
                    </div>
                </el-scrollbar>
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



        <!-- 图片放大预览 -->
        <el-image-viewer v-if="imagePreviewVisible" :url-list="[imagePreviewUrl]" @close="closeImagePreview" />

    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElImageViewer } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import avatars from '@/assets/default.png'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { useAccountStore } from '@/stores/AccountStore'
import { useComponentStore } from '@/stores/ComponentStore'
import { useContactStore } from '@/stores/ContactStore'
import { useNoticeStore } from '@/stores/NoticeStore'
import { wsClient } from '@/utils/ws';
import { ossUploader } from '@/utils/ossUploader'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

import {
    getContentTypeByFile,
    formatFileSize,
    getFileIconClass,
    compressImage,
    validateFileSize,
    getImageDimensions,
    downloadFile,
} from '@/utils/fileHelper'
import ChatMessageList from '@/components/chatView/ChatMessageList.vue'
import ChatContactList from '@/components/chatView/ChatContactList.vue'
import NoticeList from '@/components/chatView/NoticeList.vue'

const contactStore = useContactStore();
const chatRoomStore = useChatRoomStore();
const accountStore = useAccountStore();
const componentStore = useComponentStore();
const noticeStore = useNoticeStore();
const message = ref('')
const sending = ref(false)
const uploading = ref(false)
const roomContentRef = ref(null)
const fileInputRef = ref(null)
const showEmoji = ref(false)
const activeNoticeCat = ref('FRIEND_INVITE')

const noticeDetailList = computed(() => noticeStore.noticeList)
const noticeCategoryName = computed(() => {
    const map = { FRIEND_INVITE: '好友通知', GROUP_INVITE: '群通知', SYSTEM_NOTICE: '系统通知' }
    return map[activeNoticeCat.value] || '通知'
})

// ========== 通知相关方法 ==========
const isExpired = (item) => {
    if (!item.expiredAt) return item.status === 'EXPIRED'
    return new Date(item.expiredAt) < new Date() || item.status === 'EXPIRED'
}

const canHandle = (item) => {
    if (isExpired(item)) return false
    const s = item.status
    return s === 'UNREAD' || s === 'READ'
}

const formatNoticeTime = (timeStr) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return diffMin + '分钟前'
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return diffHr + '小时前'
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return diffDay + '天前'
    return d.toLocaleDateString('zh-CN')
}

const handleAccept = async (item) => {
    await noticeStore.handleNotice(item.id, 'ACCEPT')
}

const handleReject = async (item) => {
    await noticeStore.handleNotice(item.id, 'REJECT')
}

const noticeReadAll = async () => {
    await noticeStore.readAll(activeNoticeCat.value)
}
const onSelectEmoji = (emoji) => {
    message.value += emoji.i
    showEmoji.value = false
}


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

// ==================== 多媒体消息辅助函数 ====================

/** 解析非文本消息的 content JSON */
const parseFileContent = (content) => {
    if (!content) return null
    try {
        return typeof content === 'string' ? JSON.parse(content) : content
    } catch {
        return null
    }
}

/** 点击图片消息 - 放大预览 */
const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref('')
const handleImagePreview = (item) => {
    const data = parseFileContent(item.content)
    if (data?.url) {
        imagePreviewUrl.value = data.url
        imagePreviewVisible.value = true
    }
}
const closeImagePreview = () => {
    imagePreviewVisible.value = false
    imagePreviewUrl.value = ''
}

/** 点击非图片文件气泡 - 下载 */
const handleFileClick = (item) => {
    const data = parseFileContent(item.content)
    if (data?.url) {
        downloadFile(data.url, item.fileName)
    }
}

/** 触发文件选择 */
const triggerFileUpload = () => {
    fileInputRef.value?.click()
}

/** 获取 OSS 上传凭证并上传文件（含压缩与大小校验） */
const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!chatRoomStore.currentChatRoom?.id) {
        ElMessage.warning('请先选择聊天室')
        return
    }
    if (!wsClient.ws || wsClient.ws.readyState !== WebSocket.OPEN) {
        ElMessage.error('WebSocket 未连接')
        return
    }
    if (uploading.value) return
    uploading.value = true

    try {
        // ① 判断文件类型 & 大小校验
        const contentType = getContentTypeByFile(file)
        const { valid, limit, actual } = validateFileSize(file, contentType)
        if (!valid) {
            ElMessage.warning(`文件过大，${contentType === 'IMAGE' ? '图片' : contentType === 'VIDEO' ? '视频' : '文件'}不能超过 ${formatFileSize(limit)}，当前 ${formatFileSize(actual)}`)
            return
        }

        // ② 图片压缩
        let fileToUpload = file
        if (contentType === 'IMAGE') {
            const result = await compressImage(file)
            fileToUpload = result.file
            // 压缩后再次校验大小
            if (fileToUpload.size > limit) {
                ElMessage.warning(`图片压缩后仍超过 ${formatFileSize(limit)}，无法上传`)
                return
            }
        }

        // ③④ 使用 ossUploader 工具类上传
        const fileUrl = await ossUploader.upload(fileToUpload, {
            type: 'chat-file',
            targetId: chatRoomStore.currentChatRoom.id
        })

        // ⑤ 构建 content 并发送消息
        let contentObj = { url: fileUrl }

        if (contentType === 'IMAGE') {
            try {
                const dims = await getImageDimensions(fileToUpload)
                if (dims) {
                    contentObj.width = dims.width
                    contentObj.height = dims.height
                }
            } catch { /* 宽高非必须 */ }
        }

        const contentStr = JSON.stringify(contentObj)

        wsClient.sendGroupMessage(
            chatRoomStore.currentChatRoom.id,
            contentStr,
            contentType,
            currentUserId.value,
            currentUserName.value,
            currentUserAvatar.value,
            Date.now(),
            file.name,
            fileToUpload.size
        )
    } catch (err) {
        console.error('[handleFileSelected] 上传失败:', err)
        ElMessage.error('文件上传失败，请重试')
    } finally {
        uploading.value = false
    }
}



const messageList = computed(() => {
    const list = chatRoomStore.chatRoomList.filter(item => item.isActive == 1) || [];
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
            messageId: messageId,
            senderName: item.senderName || (isSelf ? currentUserName.value : ''),
            senderAvatar: item.senderAvatar || (isSelf ? currentUserAvatar.value : '') || avatars,
            contentType: item.contentType || 'TEXT',
            fileName: item.fileName || null,
            fileSize: item.fileSize || null,
            isSelf,
            sentAt: formattedTime
        }
    })
})
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
onMounted(async () => {
    await chatRoomStore.getAllRoom();
    joinAllRooms()
    await contactStore.getAllContact();
    if (chatRoomStore.currentChatRoom?.id) {
        await chatRoomStore.getCurrentMessageList();
        // wsClient.joinGroup(chatRoomStore.currentChatRoom.id)
        await scrollToBottom()
    }
})
onUnmounted(() => {
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

// 切换通知分类时拉取列表
watch(activeNoticeCat, (type) => {
    noticeStore.fetchNoticeList({ type, size: 50 })
})

// 切到通知 tab 时拉取列表
watch(sideTab, (tab) => {
    if (tab === 'notice') {
        noticeStore.fetchNoticeList({ type: activeNoticeCat.value, size: 50 })
    }
})

const currentChatRoom = computed(() => {
    return chatRoomStore.currentChatRoom;
})

watch(currentChatRoom, (val) => {
    if (val === null) {
        componentStore.rightTab = 'default'
    }
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
.icon {
    width: 25px;
    height: 25px;
}

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

    .notice-detail {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 15px;
        background-color: var(--color-third);
        border-radius: 10px;

        .notice-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            padding: 12px 4px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 8px;

            .read-all-btn {
                font-size: 13px;
                font-weight: 400;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                transition: color 0.2s;

                &:hover {
                    color: #fff;
                }
            }
        }

        .notice-empty {
            text-align: center;
            color: rgba(255, 255, 255, 0.4);
            padding: 40px 0;
            font-size: 14px;
        }

        .notice-detail-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 8px;
            border-radius: 8px;
            margin-bottom: 4px;
            transition: background 0.15s;
            cursor: pointer;

            &:hover {
                background: rgba(85, 122, 253, 0.1);
            }

            .notice-avatar {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .notice-info {
                flex: 1;
                min-width: 0;

                .notice-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    line-height: 1.6;

                    .notice-name {
                        font-size: 14px;
                        font-weight: 500;
                        color: #fff;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        flex: 1;
                        min-width: 0;
                    }

                    .notice-status {
                        font-size: 12px;
                        white-space: nowrap;
                        flex-shrink: 0;
                        margin-left: 8px;

                        &[data-status="UNREAD"] {
                            color: #557afd;
                        }

                        &[data-status="READ"] {
                            color: rgba(255, 255, 255, 0.5);
                        }

                        &[data-status="ACCEPTED"] {
                            color: var(--selected);
                        }

                        &[data-status="REJECTED"] {
                            color: #f56c6c;
                        }

                        &[data-status="EXPIRED"] {
                            color: rgba(255, 255, 255, 0.3);
                        }
                    }

                    .notice-desc {
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.6);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        flex: 1;
                        min-width: 0;
                    }

                    .notice-time {
                        font-size: 11px;
                        color: rgba(255, 255, 255, 0.3);
                        white-space: nowrap;
                        flex-shrink: 0;
                        margin-left: 8px;
                    }

                    .notice-expired {
                        font-size: 11px;
                        color: #e6a23c;
                        white-space: nowrap;
                        flex-shrink: 0;
                        margin-left: 8px;
                    }
                }

                .notice-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 6px;

                    button {
                        padding: 4px 16px;
                        font-size: 12px;
                        border-radius: 14px;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s;
                    }

                    .btn-accept {
                        color: #fff;
                        background: var(--color-primary);

                        &:hover {
                            opacity: 0.85;
                        }
                    }

                    .btn-reject {
                        color: rgba(255, 255, 255, 0.7);
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);

                        &:hover {
                            background: rgba(245, 108, 108, 0.15);
                            border-color: #f56c6c;
                            color: #f56c6c;
                        }
                    }
                }
            }
        }
    }

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

            .funBox {
                display: flex;
                align-items: center;
                gap: 10px;

                .iconfont {
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

                        /* 图片气泡 */
                        &.bubble-image {
                            padding: 4px;
                            background: #fff;
                            cursor: pointer;
                            overflow: hidden;

                            .chat-image {
                                display: block;
                                max-width: 140px;
                                max-height: 140px;
                                min-width: 60px;
                                min-height: 40px;
                                object-fit: contain;
                                border-radius: 8px;
                            }
                        }

                        /* 文件气泡 */
                        &.bubble-file {
                            cursor: pointer;
                            min-width: 200px;
                            max-width: 300px;

                            &:hover {
                                box-shadow: 0 8px 20px rgba(31, 42, 55, 0.12);
                            }

                            .file-info {
                                display: flex;
                                align-items: center;
                                gap: 12px;
                            }

                            .file-icon {
                                width: 40px;
                                height: 40px;
                                border-radius: 8px;
                                flex-shrink: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;

                                &::after {
                                    font-size: 11px;
                                    font-weight: 700;
                                    color: #fff;
                                }
                            }

                            .pdf-icon {
                                background-color: #e74c3c;

                                &::after {
                                    content: 'PDF';
                                }
                            }

                            .word-icon {
                                background-color: #2980b9;

                                &::after {
                                    content: 'DOC';
                                }
                            }

                            .excel-icon {
                                background-color: #27ae60;

                                &::after {
                                    content: 'XLS';
                                }
                            }

                            .zip-icon {
                                background-color: #f39c12;

                                &::after {
                                    content: 'ZIP';
                                }
                            }

                            .video-icon {
                                background-color: #8e44ad;

                                &::after {
                                    content: 'VID';
                                }
                            }

                            .file-default-icon {
                                background-color: #7f8c8d;

                                &::after {
                                    content: 'FILE';
                                }
                            }

                            .file-detail {
                                flex: 1;
                                min-width: 0;
                                display: flex;
                                flex-direction: column;
                                gap: 2px;

                                .file-name {
                                    font-size: 13px;
                                    color: #1f2a37;
                                    line-height: 1.4;
                                    word-break: break-all;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    display: -webkit-box;
                                    -webkit-line-clamp: 2;
                                    -webkit-box-orient: vertical;
                                    line-clamp: 2;
                                }

                                .file-size {
                                    font-size: 11px;
                                    color: #8c939d;
                                }
                            }
                        }
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

                        /* 图片气泡 - 自身消息保持白色背景 */
                        &.bubble-image {
                            background: #fff;
                            border-color: #e8eef5;
                            box-shadow: 0 6px 16px rgba(31, 42, 55, 0.06);
                        }

                        /* 文件气泡 - 自身消息 */
                        &.bubble-file {
                            background: #0099ff;
                            border-color: #0099ff;

                            .file-detail .file-name {
                                color: #fff;
                            }

                            .file-detail .file-size {
                                color: rgba(255, 255, 255, 0.7);
                            }
                        }
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

        .file-icon {
            background-color: #b8c4d0;
        }

        .emoji-icon {
            width: 20px;
            height: 20px;
            font-size: 18px;
            line-height: 20px;
            text-align: center;
            background: none;
            border-radius: 0;
        }

        .emoji-picker-popup {
            position: absolute;
            bottom: 90px;
            left: 10px;
            z-index: 100;

            :deep(.v3-emoji-picker) {
                --v3-picker-bg: #ffffff;
                --v3-picker-fg: #636d7e;
                --v3-picker-border: #e8e8e8;
                --v3-picker-input-bg: #f5f7fa;
                --v3-picker-input-border: #dcdfe6;
                --v3-picker-input-focus-border: #557afd;
                --v3-picker-emoji-hover: #f0f3ff;
                width: 320px;
                height: 340px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
                border: 1px solid #e8e8e8;
            }

            :deep(.v3-emoji-picker .v3-header) {
                padding: 10px 12px 8px;
            }

            :deep(.v3-emoji-picker .v3-header .v3-groups .v3-group) {
                font-size: 20px;
                border-radius: 8px;
                padding: 4px;
            }

            :deep(.v3-emoji-picker .v3-header .v3-groups .v3-group:hover) {
                background: #f0f3ff;
            }

            :deep(.v3-emoji-picker .v3-search input) {
                height: 30px;
                border-radius: 6px;
                font-size: 13px;
            }

            :deep(.v3-emoji-picker .v3-body .v3-body-inner .v3-group h5) {
                font-size: 12px;
                color: #9499a0;
                font-weight: 500;
            }

            :deep(.v3-emoji-picker .v3-body .v3-body-inner .v3-group .v3-emojis button) {
                border-radius: 8px;
                transition: background 0.15s;
            }

            :deep(.v3-emoji-picker .v3-body .v3-body-inner .v3-group .v3-emojis button:hover) {
                background: #f0f3ff;
                transform: scale(1.15);
            }

            :deep(.v3-emoji-picker .v3-footer) {
                font-size: 13px;
                padding: 10px 15px;
                color: #636d7e;
            }
        }

        .more-icon {
            background-color: #a0a0a0;
        }
    }

    .hidden-file-input {
        display: none;
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

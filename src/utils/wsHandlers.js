import { wsClient } from './ws'
import { useAccountStore } from '@/stores/AccountStore'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import { useOnlineUserStore } from '@/stores/OnlineUserStore'
import { useNoticeStore } from '@/stores/NoticeStore'
import { useContactStore } from '@/stores/ContactStore'
import { useComponentStore } from '@/stores/ComponentStore'
import { ElMessage } from 'element-plus'

// ========== 工具方法 ==========

/** 标准化 WS 推送的群消息，统一字段格式后存入 currentMessageList */
const buildMessageItem = (source) => {
  const accountStore = useAccountStore()
  const currentUserId = accountStore.user?.id || null
  const currentUserName = accountStore.user?.nickname || ''
  const currentUserAvatar = accountStore.user?.avatar || ''
  const isSelf = currentUserId !== null && String(source.senderId) === String(currentUserId)
  const messageId = source.messageId || source.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  return {
    id: messageId,
    messageId,
    chatRoomId: source.chatRoomId,
    senderId: source.senderId,
    senderName: source.senderName || (isSelf ? currentUserName : ''),
    senderAvatar: source.senderAvatar || (isSelf ? currentUserAvatar : ''),
    content: source.content,
    contentType: source.contentType || 'TEXT',
    fileName: source.fileName || null,
    fileSize: source.fileSize || null,
    sentAt: source.sentAt
  }
}

// ========== 各类型消息处理器 ==========

const handlers = {
  /** 在线用户列表 */
  ONLINE_LIST(msg) {
    const onlineUserStore = useOnlineUserStore()
    onlineUserStore.onlineUsers = msg.users
  },

  /** 新群创建 */
  GROUP_CREATED(msg) {
    console.log('GROUP_CREATED', msg)
    const chatRoomStore = useChatRoomStore()
    chatRoomStore.chatRoomList.push(msg.chatRoom)
  },

  /** 群消息 */
  GROUP(msg) {
    const chatRoomStore = useChatRoomStore()
    const source = msg.data || msg
    const currentRoomId = chatRoomStore.currentChatRoom?.id
    if (!source?.chatRoomId) return

    // 更新聊天室列表中该群的最新消息
    const room = chatRoomStore.chatRoomList.find(
      r => String(r.id) === String(source.chatRoomId)
    )
    if (room) {
      const displayContent = source.contentType === 'TEXT'
        ? source.content
        : source.contentType === 'IMAGE' ? '[图片]'
        : source.contentType === 'VIDEO' ? '[视频]'
        : source.contentType === 'PDF' ? '[PDF]'
        : source.contentType === 'WORD' ? '[文档]'
        : source.contentType === 'EXCEL' ? '[表格]'
        : source.contentType === 'ZIP' ? '[压缩包]'
        : '[文件]'
      room.lastMessageContent = displayContent
      room.lastMessageSenderName = source.senderName || room.lastMessageSenderName
      room.lastMessageSenderId = source.senderId || room.lastMessageSenderId
      room.lastMessageTime = source.sentAt
    }

    if (String(source.chatRoomId) === String(currentRoomId)) {
      // 当前群 → 追加消息
      if (!Array.isArray(chatRoomStore.currentMessageList)) {
        chatRoomStore.currentMessageList = []
      }
      chatRoomStore.currentMessageList.push(buildMessageItem(source))
      chatRoomStore.reportCurrentRead()
    } else {
      // 非当前群 → 本地未读数 +1
      if (room) {
        room.unreadCount = (room.unreadCount || 0) + 1
      }
    }
  },

  /** 群权限变更广播 */
  GROUP_PERMISSION_UPDATE(msg) {
    const { chatRoomId, action, data } = msg
    const accountStore = useAccountStore()
    const chatRoomStore = useChatRoomStore()
    const currentUserId = accountStore.user?.id

    switch (action) {
      case 'KICK': {
        const kicked = data?.userIds || []
        if (!kicked.includes(currentUserId)) return
        chatRoomStore.chatRoomList = chatRoomStore.chatRoomList.filter(
          r => String(r.id) !== String(chatRoomId)
        )
        if (String(chatRoomStore.currentChatRoom?.id) === String(chatRoomId)) {
          chatRoomStore.currentChatRoom = null
        }
        ElMessage.warning('你已被移出群聊')
        break
      }

      case 'MUTE': {
        const muted = data?.userIds || []
        if (!muted.includes(currentUserId)) return
        ElMessage.warning('你已被禁言')
        if (String(chatRoomStore.currentChatRoom?.id) === String(chatRoomId)) {
          chatRoomStore.getAllRoom()
        }
        break
      }

      case 'UNMUTE': {
        const unmuted = data?.userIds || []
        if (!unmuted.includes(currentUserId)) return
        ElMessage.success('你已被解除禁言')
        if (String(chatRoomStore.currentChatRoom?.id) === String(chatRoomId)) {
          chatRoomStore.getAllRoom()
        }
        break
      }

      case 'ADMIN_ADD': {
        if (String(data?.userId) !== String(currentUserId)) return
        ElMessage.success('你已被设置为管理员')
        chatRoomStore.getAllRoom()
        break
      }

      case 'ADMIN_REMOVE': {
        if (String(data?.userId) !== String(currentUserId)) return
        ElMessage.warning('你已被取消管理员')
        chatRoomStore.getAllRoom()
        break
      }

      case 'INVITE': {
        // 邀请不再直接入群，走通知流程，被邀请者通过 NEW_NOTICE 收到
        // 此广播仅通知操作者本人刷新群列表
        chatRoomStore.getAllRoom()
        break
      }

      case 'DISMISS': {
        chatRoomStore.chatRoomList = chatRoomStore.chatRoomList.filter(
          r => String(r.id) !== String(chatRoomId)
        )
        if (String(chatRoomStore.currentChatRoom?.id) === String(chatRoomId)) {
          chatRoomStore.currentChatRoom = null
        }
        ElMessage.warning('群聊已被解散')
        break
      }

      case 'GROUP_INFO_UPDATE': {
        const room = chatRoomStore.chatRoomList.find(
          r => String(r.id) === String(chatRoomId)
        )
        if (room && data) {
          Object.assign(room, data)
          if (String(chatRoomStore.currentChatRoom?.id) === String(chatRoomId)) {
            chatRoomStore.currentChatRoom = { ...room }
          }
        }
        break
      }

      case 'MEMBER_JOIN': {
        // 成员加入群，刷新群列表以更新成员数据
        chatRoomStore.getAllRoom()
        break
      }

      default:
        console.warn('[wsHandlers] 未知 GROUP_PERMISSION_UPDATE action:', action)
    }
  },

  /** 新通知推送 */
  NEW_NOTICE(msg) {
    const noticeStore = useNoticeStore()
    noticeStore.onNewNotice(msg)
  },

  /** 邀请被处理通知（发给邀请者） */
  NOTICE_HANDLED(msg) {
    if (msg.action === 'ACCEPT') {
      ElMessage.success('你的邀请已被同意')
    } else {
      ElMessage.info('你的邀请已被拒绝')
    }
    // 刷新通知列表（如果有打开的话）
    const noticeStore = useNoticeStore()
    noticeStore.fetchUnreadCount()
    if (noticeStore.currentType) {
      noticeStore.fetchNoticeList({ type: noticeStore.currentType, size: 50 })
    }
  },

  /** 好友添加成功（双方都会收到） */
  FRIEND_ADDED(msg) {
    const contactStore = useContactStore()
    contactStore.getAllContact()
  },

  /** 群邀请被同意（发给邀请者） */
  GROUP_INVITE_ACCEPTED(msg) {
    console.log('GROUP_INVITE_ACCEPTED', msg)
    const name = msg.acceptedUserName || msg.acceptedNickname || '用户'
    ElMessage.success(`${name} 已加入群聊`)
  },

  /** 新成员加入群（群内所有人都会收到） */
  GROUP_MEMBER_JOINED(msg) {
    // 加入群 WS 频道
    if (msg.chatRoomId) {
      wsClient.joinGroup(msg.chatRoomId)
    }
    // 刷新群列表（await 确保成员数据同步到 currentChatRoom）
    const chatRoomStore = useChatRoomStore()
    chatRoomStore.getAllRoom().then(() => {
      // 如果当前正在查看这个群的群管理，手动触发 currentChatRoom 更新
      if (String(chatRoomStore.currentChatRoom?.id) === String(msg.chatRoomId)) {
        const updated = chatRoomStore.chatRoomList.find(
          r => String(r.id) === String(msg.chatRoomId)
        )
        if (updated) {
          chatRoomStore.currentChatRoom = { ...updated }
        }
      }
    })
  },

  /** 被好友删除（被删方收到） */
  FRIEND_REMOVED(msg) {
    const contactStore = useContactStore()
    contactStore.getAllContact()
    ElMessage.info('你已被对方删除好友')
  },

  /** 挤号通知（其他设备登录） */
  KICKED(msg) {
    const reason = msg.reason === 'other_device_login' ? '你的账号已在其他设备登录' : '你已被强制下线'
    ElMessage.warning(reason)
    setTimeout(() => {
      wsClient.close()
      localStorage.removeItem('token')
      const accountStore = useAccountStore()
      const componentStore = useComponentStore()
      accountStore.user = null
      accountStore.isLogin = false
      componentStore.showAuthDialog = true
    }, 1500)
  }
}

// ========== 统一分发入口 ==========

const wsMessageDispatcher = (msg) => {
  if (!msg?.type) return
  const handler = handlers[msg.type]
  if (handler) {
    handler(msg)
  }
}

// ========== 注册 / 注销 ==========

let unregisterFns = []

/**
 * 注册所有 WS 消息处理器（全局一次）
 * 在 App.vue 的 onMounted 中调用
 */
export function registerWsHandlers() {
  unregisterFns.forEach(fn => fn())
  unregisterFns = []
  const off = wsClient.onMessage(wsMessageDispatcher)
  unregisterFns.push(off)
}

/**
 * 注销所有 WS 消息处理器
 * 在 App.vue 的 onUnmounted 中调用
 */
export function unregisterWsHandlers() {
  unregisterFns.forEach(fn => fn())
  unregisterFns = []
}

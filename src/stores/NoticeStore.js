import { defineStore } from "pinia";
import noticeApi from "@/api/notice";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useChatRoomStore } from "./ChatRoomStore";
import { useContactStore } from "./ContactStore";

export const useNoticeStore = defineStore("notice", () => {
    const noticeList = ref([])
    const unreadCount = ref({ total: 0, byType: {} })
    const loading = ref(false)

    /** 按类型获取未读数 */
    const getUnreadByType = (type) => {
        return unreadCount.value.byType?.[type] || 0
    }

    /** 总未读数 */
    const totalUnread = computed(() => unreadCount.value.total || 0)

    /** 拉取未读数量 */
    const fetchUnreadCount = async () => {
        try {
            const res = await noticeApi.getUnreadCount()
            if (res.code == 1) {
                unreadCount.value = res.data
            }
        } catch (err) {
            console.error('[NoticeStore] fetchUnreadCount error:', err)
        }
    }

    /** 拉取通知列表 */
    const fetchNoticeList = async (params = {}) => {
        loading.value = true
        if (params.type) currentType.value = params.type
        try {
            const res = await noticeApi.getNoticeList(params)
            if (res.code == 1) {
                noticeList.value = res.data?.records || res.data || []
            }
        } catch (err) {
            console.error('[NoticeStore] fetchNoticeList error:', err)
        } finally {
            loading.value = false
        }
    }

    /** 当前查询的分类类型（用于刷新列表） */
    const currentType = ref('')

    /** 处理通知（同意/拒绝） */
    const handleNotice = async (noticeId, action) => {
        try {
            const res = await noticeApi.handleNotice({ noticeId, action })
            if (res.code == 1) {
                if (action === 'ACCEPT') {
                    ElMessage.success('已同意')
                    // 同意后刷新相关数据
                    const item = noticeList.value.find(n => n.id === noticeId)
                    if (item) {
                        if (item.type === 'GROUP_INVITE') {
                            const chatRoomStore = useChatRoomStore()
                            await chatRoomStore.getAllRoom()
                        } else if (item.type === 'FRIEND_INVITE') {
                            const contactStore = useContactStore()
                            await contactStore.getAllContact()
                        }
                    }
                } else {
                    ElMessage.success('已拒绝')
                }
                // 重新拉取列表以确保与后端同步
                if (currentType.value) {
                    await fetchNoticeList({ type: currentType.value, size: 50 })
                }
                await fetchUnreadCount()
                return true
            } else {
                ElMessage.error(res.msg || '操作失败')
                return false
            }
        } catch (err) {
            console.error('[NoticeStore] handleNotice error:', err)
            ElMessage.error(err?.response?.data?.msg || '操作失败')
            return false
        }
    }

    /** 标记单条已读 */
    const readNotice = async (id) => {
        try {
            await noticeApi.readNotice(id)
            const item = noticeList.value.find(n => n.id === id)
            if (item && item.status === 'UNREAD') {
                item.status = 'READ'
            }
            await fetchUnreadCount()
        } catch (err) {
            console.error('[NoticeStore] readNotice error:', err)
        }
    }

    /** 全部已读 */
    const readAll = async (type) => {
        try {
            await noticeApi.readAllNotice(type ? { type } : {})
            noticeList.value.forEach(n => {
                if (!type || n.type === type) {
                    if (n.status === 'UNREAD') n.status = 'READ'
                }
            })
            await fetchUnreadCount()
        } catch (err) {
            console.error('[NoticeStore] readAll error:', err)
        }
    }

    /** 收到 WS 推送 NEW_NOTICE 时调用 */
    const onNewNotice = async (msg) => {
        // 刷新未读数
        await fetchUnreadCount()
        // 可选：弹 toast
        if (msg?.title) {
            ElMessage.info(msg.title)
        }
    }

    return {
        noticeList,
        unreadCount,
        totalUnread,
        loading,
        currentType,
        getUnreadByType,
        fetchUnreadCount,
        fetchNoticeList,
        handleNotice,
        readNotice,
        readAll,
        onNewNotice,
    }
})

import { defineStore } from "pinia";
import chat from "@/api/chat";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useAccountStore } from "./AccountStore";

// 防抖上报已读
let reportTimer = null;

const normalizeId = (value) => {
    if (value === null || value === undefined) return null
    const str = String(value).trim()
    if (!str) return null
    return str
}

const normalizeDecimalId = (value) => {
    const str = normalizeId(value)
    if (!str) return null
    if (!/^\d+$/.test(str)) return null
    const normalized = str.replace(/^0+/, "")
    return normalized || "0"
}

const isDecimalIdGreater = (a, b) => {
    if (a.length !== b.length) return a.length > b.length
    return a > b
}

const getMaxMessageId = (list = []) => {
    let maxId = null
    for (const item of list) {
        const rawId = item?.id ?? item?.messageId
        const normalizedId = normalizeDecimalId(rawId)
        if (!normalizedId) continue
        if (maxId === null || isDecimalIdGreater(normalizedId, maxId)) {
            maxId = normalizedId
        }
    }
    return maxId
}

export const useChatRoomStore = defineStore("chatRoom", () => {
    const chatRoomList = ref([]);
    const currentChatRoom = ref(null);
    const currentMessageList = ref([]);
    const getAllRoom = async()=>{
        const res = await chat.getAllChatRooms();
        if(res.code == 1){
            chatRoomList.value = res.data;
            // currentChatRoom.value = chatRoomList.value[0];
        }else{
            console.log(res.msg);
        }
    }
    const getCurrentMessageList = async(size,beforeTime)=>{
        if (!currentChatRoom.value?.id) return;
        const res = await chat.getCurrentMessageList(currentChatRoom.value.id,size,beforeTime);
        if(res.code == 1){
            const mappedMessages = res.data.map(msg => ({
                ...msg,
                id: normalizeId(msg.id ?? msg.messageId),
                messageId: normalizeId(msg.messageId ?? msg.id),
            }));
            console.log('[getCurrentMessageList] 获取到', mappedMessages.length, '条消息');
            currentMessageList.value = [...mappedMessages, ...currentMessageList.value]
        }else{
            console.log(res.msg);
        }
    }
    const createChatRoom = async(room)=>{
        const res = await chat.createChatRoom(room);
        if(res.code == 1){
            currentChatRoom.value = res.data;
            await getCurrentMessageList(50,null);
            ElMessage.success("创建成功");
        }else{
            ElMessage.error(res.msg);

        }

    }

    // 上报某个聊天室的已读位置（防抖 2 秒）
    const reportRead = (chatRoomId) => {
        if (!chatRoomId) return
        const accountStore = useAccountStore()
        const userId = accountStore.user?.id
        if (!userId) return
        // 取当前消息列表中最大的有效消息 ID，避免受数组顺序影响
        const list = currentMessageList.value
        if (!list || list.length === 0) {
            console.log('[reportRead] 消息列表为空，不上报');
            return
        }
        const lastReadMessageId = getMaxMessageId(list)
        if (!lastReadMessageId) {
            console.log('[reportRead] 当前列表没有可用的 messageId');
            return
        }
        console.log('[reportRead] 上报已读位置:', chatRoomId, '消息ID:', lastReadMessageId);
        clearTimeout(reportTimer)
        reportTimer = setTimeout(() => {
            const data = {
                chatRoomId: chatRoomId,
                lastReadMessageId: lastReadMessageId,
                userId: String(userId),
            }
            chat.reportRead(data).then(() => {
                console.log('[reportRead] 上报成功');
            }).catch((err) => {
                console.error('[reportRead] 上报失败:', err)
            })
        }, 100)
    }

    // 上报当前正在查看的聊天室的已读位置
    const reportCurrentRead = () => {
        if (!currentChatRoom.value?.id) return
        reportRead(currentChatRoom.value.id)
    }

    return { chatRoomList, currentChatRoom,getAllRoom,currentMessageList,getCurrentMessageList,createChatRoom,reportRead,reportCurrentRead };
});

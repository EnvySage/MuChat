import { defineStore } from "pinia";
import chat from "@/api/chat";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useAccountStore } from "./AccountStore";

// 防抖上报已读
let reportTimer = null;

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
            currentMessageList.value=[...res.data,...currentMessageList.value]
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
        // 取当前消息列表最后一条消息的 id
        const list = currentMessageList.value
        if (!list || list.length === 0) return
        const lastReadMessageId = list[list.length - 1].id
        console.log(lastReadMessageId);
        clearTimeout(reportTimer)
        reportTimer = setTimeout(() => {
            const data = {
                chatRoomId: chatRoomId,  // 确保是数字类型
                lastReadMessageId: lastReadMessageId,  // 确保是数字类型
                userId: String(userId),
            }
            chat.reportRead(data).catch((err) => {
                console.error('上报已读位置失败:', err)
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
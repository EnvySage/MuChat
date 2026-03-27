import { defineStore } from "pinia";
import chat from "@/api/chat";
import { ref } from "vue";
export const useChatRoomStore = defineStore("chatRoom", () => {
    const chatRoomList = ref([]);
    const currentChatRoom = ref(null);
    const currentMessageList = ref([]);
    const getAllRoom = async()=>{
        const res = await chat.getAllChatRooms();
        if(res.code == 1){
            chatRoomList.value = res.data;
            currentChatRoom.value = chatRoomList.value[0];
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
    return { chatRoomList, currentChatRoom,getAllRoom,currentMessageList,getCurrentMessageList };
});
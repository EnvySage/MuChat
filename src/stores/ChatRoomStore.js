import { defineStore } from "pinia";
import chat from "@/api/chat";
import { ref } from "vue";
export const useChatRoomStore = defineStore("chatRoom", () => {
    const chatRoomList = ref(null);
    const currentChatRoom = ref(null);
    const currentMessageList = ref(null);
    const getAllRoom = async()=>{
        const res = await chat.getAllChatRooms();
        if(res.code == 1){
            chatRoomList.value = res.data;
            currentChatRoom.value = chatRoomList.value[0];
        }else{
            console.log(res.meg);
        }
    }
    const getCurrentMessageList = async()=>{
        const res = await chat.getCurrentMessageList(currentChatRoom.value.id);
        if(res.code == 1){
            currentMessageList.value = res.data;
        }else{
            console.log(res.meg);
        }
    }
    return { chatRoomList, currentChatRoom,getAllRoom,currentMessageList,getCurrentMessageList };
});
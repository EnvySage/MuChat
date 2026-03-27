import { defineStore } from "pinia";
import { ref } from "vue";
export const useOnlineUserStore = defineStore("useOnlineUserStore", ()=>{
    const onlineUsers = ref([]);
    const currentUserInfoShow = ref(null);

    return {
        onlineUsers,
        currentUserInfoShow
    }
})
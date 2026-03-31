import { defineStore } from "pinia";
import { ref } from "vue";
export const useComponentStore = defineStore("component", () => {
    const showAuthDialog = ref(false)
    const sideTab = ref('message')
    const userInfoShow = ref(null);
    const showGroupManage = ref(false);
    const rightTab = ref('default'); // default | groupManage
    return { showAuthDialog,sideTab, userInfoShow, showGroupManage, rightTab };
});
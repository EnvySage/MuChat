import { defineStore } from "pinia";
import { ref } from "vue";
export const useComponentStore = defineStore("component", () => {
    const showAuthDialog = ref(false)
    const sideTab = ref('message')
    const userInfoShow = ref(null);
    const showGroupManage = ref(false);
    const rightTab = ref('default'); // default | groupManage
    const showInviteDialog = ref(false); // 邀请好友弹窗
    const showKickDialog = ref(false); // 踢出成员弹窗

    return { showAuthDialog,sideTab, userInfoShow, showGroupManage, rightTab, showInviteDialog, showKickDialog };
});
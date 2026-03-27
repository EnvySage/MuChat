import { defineStore } from "pinia";
import { ref } from "vue";

export const useComponentStore = defineStore("component", () => {
    const showAuthDialog = ref(false)
    const sideTab = ref('message')
    return { showAuthDialog,sideTab};
});
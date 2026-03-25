<!-- SideTab.vue -->
<template>
    <div class="sideTab">
        <div class="top">
            <AvatarWithAuth 
                :avatar-src=avatar 
                alt-text="用户头像"
                @login-success="handleLoginSuccess"
                @register-success="handleRegisterSuccess"
            />
            <div class="messageList">
                <span class="iconfont icon-liaotian"></span>
            </div>
            <div class="contact">
                <span class="iconfont icon-duoren"></span>
            </div>
        </div>
        <div class="down">
            <div class="related-link">
                <span class="iconfont icon-github"></span>
                <span class="iconfont icon-bilibili"></span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAccountStore } from '@/stores/AccountStore'
import { computed } from 'vue'
import AvatarWithAuth from '@/components/chatView/AvatarWithAuth.vue' // 引入组件
import defaultImg from '@/assets/default.png'
const accountStore = useAccountStore()
const avatar = computed(() => accountStore.user?.avatar || defaultImg)
// 处理登录成功的回调
const handleLoginSuccess = (formData) => {
    console.log('登录成功', formData)
    window.location.reload()
}

// 处理注册成功的回调
const handleRegisterSuccess = (formData) => {
    console.log('注册成功', formData)
    // 这里可以处理注册成功后的逻辑
}
</script>

<style lang="scss" scoped>
.sideTab {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 10px 5px;

    .top {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .down {
        width: 100%;
        display: flex;
        flex-direction: column;

        .related-link {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }
    }
}

.iconfont {
    font-size: 30px;
    color: var(--color-last);
}
</style>
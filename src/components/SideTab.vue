<!-- SideTab.vue -->
<template>
    <div class="sideTab">
        <div class="top">
            <AvatarWithAuth :avatar-src=avatar alt-text="用户头像" @login-success="handleLoginSuccess"
                @register-success="handleRegisterSuccess" />
            <div class="btnList">
                <el-segmented v-model="btnName" :options="options" direction="vertical">
                    <template #default="scope">
                        <div class="btn">
                            <span class="iconfont" :class="scope.item.icon"></span>
                        </div>
                    </template>
                </el-segmented>
            </div>
        </div>
        <div class="down">
            <div class="related-link">
                <span class="iconfont icon-tianjiajiahaowubiankuang" style="font-weight: bold;" @click="handleAdd"></span>
                <span class="iconfont icon-tuichu" @click="handleLogout"></span>
                <span class="iconfont icon-github" @click="handleGithub"></span>
                <span class="iconfont icon-bilibili" @click="handleBilibili"></span>
                
            </div>
        </div>
        <SearchAddDialog />
    </div>
</template>

<script setup>
import { useAccountStore } from '@/stores/AccountStore'
import { computed, ref,watch } from 'vue'
import AvatarWithAuth from '@/components/chatView/AvatarWithAuth.vue' // 引入组件
import SearchAddDialog from '@/components/SearchAddDialog.vue'
import defaultImg from '@/assets/default.png'
import { useComponentStore } from '@/stores/ComponentStore'
import { wsClient } from '@/utils/ws'
const componentStore = useComponentStore()
const accountStore = useAccountStore()
const avatar = computed(() => accountStore.user?.avatar || defaultImg)
const btnName = ref('message')
watch(() => componentStore.sideTab, (newValue) => {
    btnName.value = newValue
})
watch(() => btnName.value, (newValue) => {
    componentStore.sideTab = newValue
})
const options = [
    {
        label: '消息',
        value: 'message',
        icon: 'icon-liaotian'
    },
    {
        label: '联系人',
        value: 'contact',
        icon: 'icon-duoren'
    },
    {
        label: '通知',
        value: 'notice',
        icon: 'icon-youxiang'
    }
]
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

// 退出登录
const handleLogout = () => {
    wsClient.close()
    localStorage.removeItem('token')
    accountStore.user = null
    accountStore.isLogin = false
    window.location.reload()
}

// 打开搜索添加弹窗
const handleAdd = () => {
    componentStore.showSearchAddDialog = true
}
const handleGithub = () => {
    window.open('https://github.com/EnvySage/MuChat', '_blank')
}
const handleBilibili = () => {
    window.open('https://space.bilibili.com/319154045?spm_id_from=333.1007.0.0', '_blank')
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
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1), inset 0 0 5px rgba(85, 122, 253, 0.5);
    border-radius: 10px;
    .top {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;

        .btnList {
            .el-segmented {
                --el-segmented-item-selected-bg-color: var(--color-secondary);
                --el-border-radius-base: 16px;
                --el-segmented-bg-color: var(--color-primary);
                --el-segmented-item-hover-bg-color: var(--color-third);
                --el-segmented-item-active-bg-color: transparent;
            }
        }
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
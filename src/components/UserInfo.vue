<template>
    <div class="userInfoBox">
        <div class="avatarBox">
            <img :src="accountStore.user?.avatar || defaultImg" alt="avatar">
        </div>
        <div class="InfoBox">
            <div class="nickName">
                <span class="nickName">{{ accountStore.user?.nickname || '未命名' }}</span>
            </div>
            <div class="desc">
                <span class="signature">{{ accountStore.user?.description || '这个人很懒，什么都没有留下' }}</span>
                <span class="status">{{ accountStore.user?.status? '在线' : '离线' }}</span>
                <span class="email">{{ accountStore.user?.email || '未绑定' }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAccountStore } from '@/stores/AccountStore';
import defaultImg from '@/assets/default.png'
const accountStore = useAccountStore();
</script>

<style lang="scss" scoped>
.userInfoBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    background: var(--color-third);

    .avatarBox {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
        }
    }

    .InfoBox {
        display: flex;
        flex-direction: column;
        align-items: center;

        .nickName {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .desc {
            font-size: 14px;
            color: #7700ff;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            span {
                margin-right: 10px;
            }
        }
    }
}
</style>
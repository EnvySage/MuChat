<template>
    <div class="user-list">
        <div class="list-title">
            在线人数：<span class="count">{{ count }}</span>
        </div>
        <div class="list-box">
            <div class="list-item" v-for="(item, index) in userList" :key="index" @click="setUserInfo(item)">
                <img class="avatar" :src="item?.avatar" alt="">
                <div class="name">{{ item?.nickname }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref,onMounted,computed } from 'vue'
import avatar from '../assets/default.png'
import { useOnlineUserStore } from '../stores/OnlineUserStore'
const OnlineUserStore = useOnlineUserStore()
const userList = computed(()=>OnlineUserStore.onlineUsers)
const count = computed(()=>OnlineUserStore.onlineUsers.length)
const setUserInfo = (item)=>{
    OnlineUserStore.currentUserInfoShow = item
}

</script>

<style lang="scss" scoped>
.user-list { 
    border-radius: 10px;
    width: 100%;
    height: 49%;
    background: var(--color-third);
    display: flex;
    flex-direction: column;
    gap: 10px;
    .list-title { 
        padding: 5px 10px;
        font-size: 16px;
        display: flex;
        align-items: center;
        color: white;
    }
    .list-box { 
        width: 100%;
        height: 100%;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 10px;
        .list-item { 
            display: flex;
            align-items: center;
            padding: 5px 10px;
            gap: 10px;
            border-radius: 10px;
            .avatar { 
                width: 35px;
                height: 35px;
                border-radius: 50%;
            }
            .name { 
                color: white;
                font-size: 14px;
                font-weight: bold;
                margin-left: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;

            }
            &:hover {
                background: var(--color-primary);
            }
        }
    }
}
</style>
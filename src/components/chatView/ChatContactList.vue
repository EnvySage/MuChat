<template>
    <div class="title">联系人</div>
    <el-scrollbar height="100%" @end-reached="loadMoreContact">
        <div class="warn" v-if="contactList.length <= 0">你还没有添加联系人哦</div>
        <div v-for="item in contactList" :key="item.id" class="scrollbar-demo-item" @click="selectContact(item)">
            <div class="avatar">
                <img :src="item.contactAvatar || defaultImg" alt=""></img>
                <span
                    class="status-dot"
                    :class="{ online: isOnline(item.contactId), offline: !isOnline(item.contactId) }"
                ></span>
            </div>
            <div class="content">
                <div class="name">{{ item.contactNickname }}</div>
                <div class="desc">{{ item.contactDescription }}</div>
            </div>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { computed, ref } from 'vue';
import defaultImg from '@/assets/default.png'
import { useOnlineUserStore } from '@/stores/OnlineUserStore';
import { useComponentStore } from '@/stores/ComponentStore';
const componentStore = useComponentStore()
const props = defineProps({
    contactList: Array,
})
const emit = defineEmits(['loadMoreContact'])

const OnlineUserStore = useOnlineUserStore();

// 判断联系人是否在线
const isOnline = (contactId) => {
    return OnlineUserStore.onlineUsers.some(user => user.id === contactId);
}

const loadMoreContact = () => {
    emit('loadMoreContact')
}

const selectContact = (item) => {
    const user={
        id:item.contactId,
        avatar:item.contactAvatar,
        nickname:item.contactNickname,
        description:item.contactDescription,
        onlineStatus:item.contactOnlineStatus,
        email:item.email,
    }
    componentStore.userInfoShow = user
}

</script>
<style lang="scss" scoped>
.scrollbar-demo-item {
    display: flex;
    align-items: center;
    padding: 15px;
    height: 70px;
    width: 97%;
    border-radius: 10px;
    background: var(--color-third);
    color: white;
    margin: 0px;
    margin-bottom: 10px;

    .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 10px;
        position: relative;

        img {
            width: 100%;
            height: 100%;
        }

        .status-dot {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid var(--color-third);

            &.online {
                background: #61ff12;
            }

            &.offline {
                background: #909399;
            }
        }
    }

    .content {
        .name {
            font-size: 16px;
            font-weight: 600;
        }

        .desc {
            font-size: 12px;
            color: var(--text2);
        }
    }
}

.el-slider {
    margin-top: 20px;
}
.warn{
    text-align: center;
    font-size: 14px;
    color: white;
    padding: 50% 0;
}
.title{
    background-color: var(--color-secondary);
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: white;
    border-radius: 10px;
    width: 97%;
    padding:15px;
    margin-bottom: 10px;
}
</style>
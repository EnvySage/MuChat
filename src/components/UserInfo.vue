<template>
    <div class="userInfoBox">
        <div class="avatarBox">
            <img :src="userInfo?.avatar || defaultImg" alt="avatar">
        </div>
        <div class="InfoBox">
            <div class="nickName">
                <span class="nickName">{{ userInfo?.nickname || '未命名' }}</span>
            </div>
            <div class="desc">
                <span class="signature">{{ userInfo.description || '这个人很懒，什么都没有留下' }}</span>
                <span class="status">{{ userInfo?.status ? '在线' : '离线' }}</span>
                <span class="email">{{ userInfo?.email || '未绑定' }}</span>
            </div>
        </div>
        <div class="btnBox">
            <div class="btn" v-if="userInfo.id==accountStore.user.id">
                <span class="iconfont icon-xiugai"></span>
                <span class="text">修改信息</span>
            </div>
            <div class="btn" v-else-if="userInfo.id!=accountStore.user.id && !ContactStore.contactList.find(item => item.contactId == userInfo.id)"
            @click="addContact">
                <span class="iconfont icon-yaoqing"></span>
                <span class="text">添加联系</span>
            </div>
            <div class="btn" v-else
            @click="deleteContact">
                <span class="iconfont icon-shanchulianxiren"></span>
                <span class="text">删除联系</span>
            </div>
            <div class="btn">
                <span class="iconfont icon-chuangjianqunliao"></span>
                <span class="text">创建群聊</span>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAccountStore } from '@/stores/AccountStore';
import { useOnlineUserStore } from '@/stores/OnlineUserStore';
import { useContactStore } from '@/stores/ContactStore';
import defaultImg from '@/assets/default.png'
const accountStore = useAccountStore();
const OnlineUserStore = useOnlineUserStore();
const ContactStore = useContactStore();
const userInfo = computed(() => {
    if (OnlineUserStore.currentUserInfoShow == null) {
        return accountStore.user
    } else {
        return OnlineUserStore.currentUserInfoShow
    }
})
const contact = computed(() => {
    return {
        contactId: userInfo.value.id,
        contactNickname: userInfo.value.nickname,
        alias: userInfo.value.nickname,
    }
})
const addContact = async () => {
    await ContactStore.addContact(contact.value)
}
const deleteContact = async () => {
    await ContactStore.deleteContact(userInfo.value.id)
}
</script>

<style lang="scss" scoped>
.userInfoBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    width: 100%;
    height: 49%;
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

    .btnBox {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        margin-top: 10px;

        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            width: 60px;
            height: 60px;
            border-radius: 10px;
            background: var(--color-primary-hover);
            cursor: pointer;
            transition: all 0.3s ease-in-out;
            color: white;

            &:hover {
                background: var(--color-primary);
            }

            .iconfont {
                font-size: 24px;
            }

            .text {
                font-size: 12px;
            }
        }
    }
}
</style>
<template>
    <div class="layout-box">
        <div class="layout-header"></div>
        <div class="layout-content">
            <div class="layout-content-left">
              <SideTab />  
            </div>
            <div class="layout-content-center">
                <ChatView />
            </div>
            <div class="layout-content-right">
                <UserInfo v-if="componentStore.rightTab === 'default'" />
                <UserList v-if="componentStore.rightTab === 'default'" />
                <GroupManage v-else-if="componentStore.rightTab === 'groupManage'" />
                <InviteMemberDialog @confirm="handleInviteSuccess" />
            </div>
        </div>
        <div class="layout-footer"></div>
    </div>
</template>

<script setup>
import { useComponentStore } from '@/stores/ComponentStore';
import SideTab from '@/components/SideTab.vue';
import ChatView from '@/view/ChatView.vue';
import UserList from '@/components/UserList.vue';
import UserInfo from '@/components/UserInfo.vue';
import GroupManage from '@/components/group/GroupManageDrawer.vue';
import InviteMemberDialog from '@/components/group/InviteMemberDialog.vue';

const handleInviteSuccess = (userIds) => {
    console.log('邀请成功:', userIds);
    // 可以刷新群成员列表
};
const componentStore = useComponentStore();
</script>

<style lang="scss" scoped>
.layout-box{
    display: flex;
    height: 100%;
    width: 100%;
}
.layout-content{
    display: flex;
    height: 100%;
    width: 100%;
    padding: 15px;
    gap: 10px;
    .layout-content-left{
        width: 70px;
        height: 100%;
    }
    .layout-content-center{
        flex: 1;
    }
    .layout-content-right{
        width: 230px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
}
</style>
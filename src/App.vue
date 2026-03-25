<script setup>
import { ref,onMounted,onUnmounted } from 'vue';
import { useAccountStore } from './stores/AccountStore';
import { ElMessage } from 'element-plus';
import { useComponentStore } from './stores/ComponentStore';
import { wsClient } from './utils/ws';
import { useOnlineUserStore } from './stores/OnlineUserStore';
const componentStore = useComponentStore()
const OnlineUserStore = useOnlineUserStore()
const accountStore = useAccountStore();
const verifyAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await accountStore.VerifyToken(token);
      if (!accountStore.user) {
        // 验证失败，清理无效token并跳转登录
        localStorage.removeItem('token');
        ElMessage.error('登录已过期，请重新登录');
        componentStore.showAuthDialog = true
        // 可以考虑跳转到登录页
        // router.push('/login');
      }
    } else {
      ElMessage.error('请先登录');
      componentStore.showAuthDialog = true
    }
    // 如果没有token，store会自动处理未登录状态
  } catch (error) {
    console.error('Token验证失败:', error);
    localStorage.removeItem('token');
    ElMessage.error('登录验证失败，请重新登录');
  }
}

onMounted(async()=>{
 await verifyAuth();
 wsClient.onMessage(handleOnlineUser)
 await wsClient.connect(localStorage.getItem('token'));
 handleHeartBreak();
});
onUnmounted(() => {
  wsClient.close();
});
const handleOnlineUser = (msg) => { 
  if (msg?.type !== 'ONLINE_LIST') return
  OnlineUserStore.onlineUsers = msg.users
}
const handleHeartBreak = () => {
  setInterval(() => {
    wsClient.send({
      type: 'HEARTBEAT',
      content: accountStore.user.id,
    });
  }, 180000); 
}
</script>

<template>
  <div class="app-bg">
    <div class="mainContent">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.app-bg {
  background-image: url('@/assets/img/app-bg.jpg');
  background-size: cover;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mainContent {
  background: var(--color-primary);
  width: 1300px;
  height: 650px;
  border-radius: 10px;
}
</style>

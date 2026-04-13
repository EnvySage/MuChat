<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAccountStore } from './stores/AccountStore';
import { ElMessage } from 'element-plus';
import { useComponentStore } from './stores/ComponentStore';
import { wsClient } from './utils/ws';
import { registerWsHandlers, unregisterWsHandlers } from './utils/wsHandlers';
import { useNoticeStore } from './stores/NoticeStore';
import { Loading as ElemeLoading } from '@element-plus/icons-vue';
const componentStore = useComponentStore()
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

onMounted(async () => {
  await initApp();
});
onUnmounted(() => {
  unregisterWsHandlers();
  wsClient.close();
  accountStore.isLogin = false;
});
const isLoading = ref(true)
const animationDelay = ref(true);
const initApp = async () => {
  try {
    await verifyAuth();
    accountStore.isLogin = true;
    registerWsHandlers();
    await wsClient.connect(localStorage.getItem('token'));
    const noticeStore = useNoticeStore();
    await noticeStore.fetchUnreadCount();
    handleHeartBreak();
  } catch (error) {
    console.error(error, '初始化应用失败')
  } finally {
    setTimeout(() => {
      animationDelay.value = false;
    }, 2000);
    isLoading.value = false
  }
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
      <!-- 显示加载界面 -->
      <div v-if="isLoading || (animationDelay)" class="loading-container">
        <!-- 太极图从中间飞上来并旋转 -->
        <div class="taichi-container" :class="{ 'taichi-show': isLoading }">
          <img src="@/assets/img/taichi.png" alt="太极图" class="taichi-image" />
        </div>
      </div>
      <!-- 加载完成后显示路由内容 -->
      <router-view v-else></router-view>
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
  position: relative;
  overflow: hidden;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
/* 太极图容器 */
.taichi-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0;
  transition: all 10s ease-in-out;
  z-index: 1000;
}

.taichi-show {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

/* 太极图样式 */
.taichi-image {
  width: 200px;
  height: 200px;
  animation: rotate 10s infinite linear;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(3600deg);
  }
}
</style>

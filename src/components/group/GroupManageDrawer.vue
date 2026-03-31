<template>
  <div class="group-manage-container">
    <div class="group-manage-header">
      <span class="back-btn" @click="back">
        <span class="iconfont icon-fanhui"></span>
      </span>
      <span class="title">群管理</span>
    </div>
    <div class="group-manage-body">
      <!-- 群信息区域 -->
      <div class="group-info-section">
        <div class="group-header">
          <div class="group-avatar">
            <img :src="currentRoom?.avatar || defaultAvatar" alt="群头像">
          </div>
          <div class="group-name-section">
            <div class="group-name">{{ currentRoom?.name || '群聊' }}</div>
            <div class="group-id">ID: {{ currentRoom?.id || '' }}</div>
          </div>
        </div>
        <div class="group-actions">
          <span class="action-item" @click="shareGroup">
            <span class="iconfont icon-fenxiang"></span>
            分享
          </span>
        </div>
      </div>

      <!-- 群成员区域 -->
      <div class="group-members-section">
        <div class="section-header">
          <span class="section-title">群成员 {{ memberCount }}人</span>
          <span class="view-all" @click="viewAllMembers">全部 ></span>
        </div>
        <div class="members-grid">
          <div class="member-item" v-for="(member, index) in displayMembers" :key="index">
            <div class="member-avatar">
              <img :src="member.avatar || defaultAvatar" :alt="member.name">
            </div>
            <div class="member-name">{{ member.name }}</div>
          </div>
          <div class="member-item add-member" @click="addMember">
            <div class="member-avatar add">
              <span class="iconfont icon-tianjia"></span>
            </div>
            <div class="member-name">添加</div>
          </div>
        </div>
      </div>

      <!-- 群设置区域 -->
      <div class="group-settings-section">
        <div class="setting-item" @click="editNotice">
          <div class="setting-left">
            <span class="iconfont icon-gonggao setting-icon"></span>
            <span class="setting-label">群公告</span>
          </div>
          <div class="setting-value">
            <span class="notice-text">{{ groupNotice || '暂无' }}</span>
          </div>
        </div>
        <div class="setting-item" @click="editMyNickname">
          <div class="setting-left">
            <span class="iconfont icon-yonghu setting-icon"></span>
            <span class="setting-label">我的群昵称</span>
          </div>
          <div class="setting-value">
            <span>{{ myNickname || currentUserName }}</span>
          </div>
        </div>
        <div class="setting-item" @click="editRemark">
          <div class="setting-left">
            <span class="iconfont icon-beizhu setting-icon"></span>
            <span class="setting-label">群备注</span>
          </div>
          <div class="setting-value">
            <span>{{ groupRemark || '无' }}</span>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-left">
            <span class="iconfont icon-quanxian setting-icon"></span>
            <span class="setting-label">发言权限</span>
          </div>
          <div class="setting-value">
            <span>{{ canSpeak ? '允许' : '禁止' }}</span>
            <el-switch
              v-model="canSpeak"
              @change="handleSpeakPermissionChange"
            />
          </div>
        </div>
        <div class="setting-item" @click="editJoinMethod">
          <div class="setting-left">
            <span class="iconfont icon-shezhi setting-icon"></span>
            <span class="setting-label">加群方式</span>
          </div>
          <div class="setting-value">
            <span>{{ joinMethod }}</span>
            <span class="iconfont icon-youjiantou"></span>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-section">
        <div class="action-item danger" @click="exitGroup">
          <span class="iconfont icon-tuichu"></span>
          退出群聊
        </div>
        <div class="action-item danger dismiss" @click="dismissGroup" v-if="isGroupOwner">
          <span class="iconfont icon-jieshu"></span>
          解散群聊
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useComponentStore } from '@/stores/ComponentStore';
import { useChatRoomStore } from '@/stores/ChatRoomStore';
import { useAccountStore } from '@/stores/AccountStore';
import defaultAvatar from '@/assets/default.png';

const componentStore = useComponentStore();
const chatRoomStore = useChatRoomStore();
const accountStore = useAccountStore();

const currentRoom = computed(() => chatRoomStore.currentChatRoom);
const currentUserName = computed(() => accountStore.user?.nickname || '我');

// 模拟数据
const memberCount = computed(() => 15);
const myNickname = computed(() => '');
const groupNotice = computed(() => '欢迎加入群聊，请遵守群规');
const groupRemark = computed(() => '');
const canSpeak = computed(() => true);
const joinMethod = computed(() => '需要审核');
const isGroupOwner = computed(() => true);

// 显示的成员（前5个）
const displayMembers = computed(() => {
  return [
    { name: '管理员', avatar: defaultAvatar },
    { name: '小明', avatar: defaultAvatar },
    { name: '小红', avatar: defaultAvatar },
    { name: '小刚', avatar: defaultAvatar },
    { name: '小丽', avatar: defaultAvatar }
  ];
});

const back = () => {
  componentStore.rightTab = 'default';
};

const viewAllMembers = () => {
  // TODO: 打开全部成员列表
  console.log('查看全部成员');
};

const addMember = () => {
  // TODO: 打开添加成员弹窗
  console.log('添加成员');
};

const handleSpeakPermissionChange = (val) => {
  console.log('发言权限:', val);
};

const shareGroup = () => {
  console.log('分享群组');
};

const editNotice = () => {
  console.log('编辑群公告');
};

const editMyNickname = () => {
  console.log('编辑我的群昵称');
};

const editRemark = () => {
  console.log('编辑群备注');
};

const editJoinMethod = () => {
  console.log('编辑加群方式');
};

const exitGroup = () => {
  console.log('退出群聊');
};

const dismissGroup = () => {
  console.log('解散群聊');
};
</script>

<style lang="scss" scoped>
.group-manage-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-third);
  border-radius: 10px;
  overflow: hidden;

  .group-manage-header {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .back-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text2);
      transition: color 0.3s;
      margin-right: 8px;

      &:hover {
        color: white;
      }

      .iconfont {
        font-size: 20px;
      }
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: white;
    }
  }

  .group-manage-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
}

// 群信息区域
.group-info-section {
  margin-bottom: 20px;

  .group-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .group-avatar {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .group-name-section {
      flex: 1;
      min-width: 0;

      .group-name {
        font-size: 14px;
        font-weight: 600;
        color: white;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .group-id {
        font-size: 12px;
        color: var(--text2);
      }
    }

    .share-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      padding: 6px 12px;
      font-size: 12px;
    }
  }
}

// 群成员区域
.group-members-section {
  margin-bottom: 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text1);
    }

    .view-all {
      font-size: 12px;
      color: var(--primary-color);
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .members-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;

    .member-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;

      .member-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        margin-bottom: 4px;
        background-color: var(--color-secondary);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        &.add {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-secondary);
          color: var(--text2);

          .iconfont {
            font-size: 20px;
          }
        }

        &:hover {
          opacity: 0.8;
        }
      }

      .member-name {
        font-size: 11px;
        color: var(--text1);
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }
    }
  }
}

// 群设置区域
.group-settings-section {
  margin-bottom: 20px;

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:last-child {
      border-bottom: none;
    }

    .setting-label {
      font-size: 13px;
      color: var(--text2);
    }

    .setting-value {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text1);

      .notice-text {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .edit-icon {
        font-size: 12px;
        color: var(--text2);
        cursor: pointer;

        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
}

// 操作按钮区域
.action-section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .exit-btn,
  .dismiss-btn {
    width: 100%;
    padding: 8px 0;
    font-size: 13px;
  }

  .dismiss-btn {
    background-color: #f56c6c;
    border-color: #f56c6c;

    &:hover {
      background-color: #f78989;
      border-color: #f78989;
    }
  }
}
</style>

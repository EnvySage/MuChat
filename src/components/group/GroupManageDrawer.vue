<template>
  <div class="group-manage-container">
    <div class="group-manage-header">
      <span class="back-btn" @click="back">
        <el-icon :size="20">
          <Back />
        </el-icon>
      </span>
      <span class="title">群管理</span>
    </div>
    <div class="group-manage-body">
      <!-- 群信息区域 -->
      <div class="group-info-section">
        <div class="group-header">
          <div class="group-avatar" :class="{ editable: canEditGroup }" @click="canEditGroup && triggerAvatarUpload()">
            <img :src="currentRoom?.avatarUrl || defaultAvatar" alt="群头像">
            <div class="avatar-overlay" v-if="canEditGroup">
              <el-icon :size="16">
                <Upload />
              </el-icon>
              <span>更换</span>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="handleAvatarChange">
          </div>
          <div class="group-name-section">
            <div class="group-name" v-if="!canEditGroup">{{ currentRoom?.name || '群聊' }}</div>
            <el-input v-else v-model="groupNameInput" size="small" class="group-name-input"
              @blur="handleGroupNameBlur" />
            <div class="group-id">ID: {{ currentRoom?.id || '' }}</div>
          </div>
          <!-- <div class="group-actions">
            <span class="action-item" @click="shareGroup">
              <el-icon><Share /></el-icon>
              分享
            </span>
          </div> -->
        </div>
      </div>

      <!-- 群成员区域 -->
      <div class="group-members-section">
        <div class="section-header">
          <span class="section-title">群成员 {{ memberCount }}人</span>
          <span class="view-all" @click="viewAllMembers">全部<el-icon v-show="!viewAllMembersFlag">
              <ArrowRight />
            </el-icon><el-icon v-show="viewAllMembersFlag">
              <ArrowDown />
            </el-icon></span>
        </div>
        <div class="members-grid">
          <div class="member-item" v-for="(member, index) in displayMembers" :key="index">
            <div class="member-avatar">
              <img :src="member.avatarUrl || defaultAvatar" :alt="member.userName">
            </div>
            <div class="member-name">{{ member.userName }}</div>
          </div>
          <div class="member-item add-member" @click="addMember">
            <div class="member-avatar add">
              <el-icon :size="46" color="white">
                <CirclePlus />
              </el-icon>
            </div>
            <div class="member-name">添加</div>
          </div>
          <div class="member-item add-member" v-if="canEditGroup" @click="kickMember">
            <div class="member-avatar add kick">
              <el-icon :size="46" color="white">
                <Remove />
              </el-icon>
            </div>
            <div class="member-name">踢人</div>
          </div>

        </div>
      </div>

      <!-- 群设置区域 -->
      <div class="group-settings-section">
        <!-- <div class="setting-item" @click="editNotice">
          <div class="setting-left">
            <span class="iconfont icon-gonggao setting-icon"></span>
            <span class="setting-label">群公告</span>
          </div>
          <div class="setting-value">
            <span class="notice-text">{{ groupNotice || '暂无' }}</span>
          </div>
        </div> -->
        <div class="setting-item">
          <div class="setting-left">
            <span class="iconfont icon-yonghu setting-icon"></span>
            <span class="setting-label">我的群昵称</span>
          </div>
          <div class="setting-value nickname-input-wrapper">
            <el-input v-model="nicknameInput" size="small" @blur="handleNicknameBlur" />
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
        <div class="setting-item" v-if="canEditGroup" @click="showMuteDialog">
          <div class="setting-left">
            <span class="iconfont icon-quanxian setting-icon"></span>
            <span class="setting-label">禁言管理</span>
          </div>
          <div class="setting-value">
            <span class="iconfont icon-youjiantou"></span>
          </div>
        </div>
        
        <!-- 管理员设置 -->
        <div class="setting-item" v-if="isGroupOwner" @click="showSetAdminDialog">
          <div class="setting-left">
            <span class="iconfont icon-yonghu setting-icon"></span>
            <span class="setting-label">管理员设置</span>
          </div>
          <div class="setting-value">
            <span class="iconfont icon-youjiantou"></span>
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
        <div class="action-item danger" @click="exitGroup" v-if="!isGroupOwner">
          <span class="iconfont icon-tuichu"></span>
          退出群聊
        </div>
        <div class="action-item danger dismiss" @click="dismissGroup" v-if="isGroupOwner" style="color: red;display: flex;align-items: center;justify-content: center;cursor: pointer;">
          <span class="iconfont icon-jieshu"></span>
          解散群聊
        </div>
      </div>
    </div>

    <!-- 禁言管理弹窗 -->
    <el-dialog v-model="muteDialogVisible" title="禁言管理" width="600px" :close-on-click-modal="false" class="mute-dialog">
      <div class="mute-dialog-body">
        <div class="mute-panel">
          <div class="mute-panel-title">群成员</div>
          <div class="mute-panel-list">
            <div class="mute-member-item" v-for="member in muteLeftList" :key="member.userId"
              @click="addToMuted(member)">
              <img class="mute-member-avatar" :src="member.avatarUrl || defaultAvatar" />
              <span class="mute-member-name">{{ member.userName }}</span>
              <el-icon color="var(--primary-color)">
                <ArrowRight />
              </el-icon>
            </div>
            <div class="mute-panel-empty" v-if="muteLeftList.length === 0">暂无可禁言成员</div>
          </div>
        </div>
        <div class="mute-panel">
          <div class="mute-panel-title">已禁言</div>
          <div class="mute-panel-list">
            <div class="mute-member-item" v-for="member in muteRightList" :key="member.userId"
              @click="removeFromMuted(member)">
              <el-icon color="#f56c6c">
                <ArrowLeft />
              </el-icon>
              <img class="mute-member-avatar" :src="member.avatarUrl || defaultAvatar" />
              <span class="mute-member-name">{{ member.userName }}</span>
            </div>
            <div class="mute-panel-empty" v-if="muteRightList.length === 0">暂无禁言成员</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="muteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="muteSubmitting" @click="submitMute">确定</el-button>
      </template>
    </el-dialog>

    <KickMemberDialog />
    <SetAdminDialog />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useComponentStore } from '@/stores/ComponentStore';
import { useChatRoomStore } from '@/stores/ChatRoomStore';
import { useAccountStore } from '@/stores/AccountStore';
import defaultAvatar from '@/assets/default.png';
import { Back, Share, CirclePlus, ArrowRight, ArrowDown, ArrowLeft, Upload, Remove } from '@element-plus/icons-vue'
import { ossUploader } from '@/utils/ossUploader';
import { ElMessage,ElMessageBox} from 'element-plus';
import KickMemberDialog from './KickMemberDialog.vue';
import SetAdminDialog from './SetAdminDialog.vue';
const componentStore = useComponentStore();
const chatRoomStore = useChatRoomStore();
const accountStore = useAccountStore();

const currentRoom = computed(() => chatRoomStore.currentChatRoom);

// 当前用户在群中的角色
const currentUserRole = computed(() => {
  const userId = accountStore.user?.id;
  const member = currentRoom.value?.members?.find(m => String(m.userId) === String(userId));
  return member?.role?.toLowerCase() || '';
});

// 是否有权限编辑群信息（群主或管理员）
const canEditGroup = computed(() => currentUserRole.value === 'owner' || currentUserRole.value === 'admin');

const isGroupOwner = computed(() => currentUserRole.value === 'owner');

// 模拟数据
const memberCount = computed(() => chatRoomStore.currentChatRoom?.memberCount || 0);
const groupNotice = computed(() => '欢迎加入群聊，请遵守群规');
const groupRemark = computed(() => '');
const joinMethod = computed(() => '需要审核');

// 群名称编辑
const groupNameInput = ref(currentRoom.value?.name || '');

// 监听 currentRoom 变化同步群名称
watch(() => currentRoom.value?.name, (val) => {
  groupNameInput.value = val || '';
}, { immediate: true });

const handleGroupNameBlur = async () => {
  const newName = groupNameInput.value.trim();
  if (!newName || newName === currentRoom.value?.name) {
    groupNameInput.value = currentRoom.value?.name || '';
    return;
  }
  try {
    const res = await chatRoomStore.updateGroupInfo({ chatRoomId: currentRoom.value.id, name: newName });
    if (res.code === 1 || res.code === 200) {
      currentRoom.value.name = newName;
    } else {
      groupNameInput.value = currentRoom.value?.name || '';
    }
  } catch (error) {
    console.error('修改群名称失败:', error);
    groupNameInput.value = currentRoom.value?.name || '';
  }
};

// 群头像上传
const avatarInput = ref(null);
const uploadingAvatar = ref(false);

const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 校验文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB');
    return;
  }

  uploadingAvatar.value = true;
  try {
    const avatarUrl = await ossUploader.upload(file, { type: 'group-avatar', targetId: currentRoom.value.id });
    const res = await chatRoomStore.updateGroupInfo({ chatRoomId: currentRoom.value.id, avatarUrl });
    if (res.code === 1 || res.code === 200) {
      currentRoom.value.avatarUrl = avatarUrl;
    }
  } catch (error) {
    console.error('上传群头像失败:', error);
  } finally {
    uploadingAvatar.value = false;
    // 清空 input 以便重复选择同一文件
    if (avatarInput.value) avatarInput.value.value = '';
  }
};

const nicknameInput = ref(chatRoomStore.currentChatRoom?.members.find(item => item.userId === accountStore.user?.id)?.roomName || '');
const handleNicknameBlur = () => {
  const data = {
    chatRoomId: chatRoomStore.currentChatRoom?.id,
    userId: accountStore.user?.id,
    roomName: nicknameInput.value
  }
  chatRoomStore.updateGroupNickname(data);
  console.log('nicknameInput:', nicknameInput.value);
};

// 显示的成员（前5个）
const displayMembers = computed(() => {
  const members = chatRoomStore.currentChatRoom?.members || [];
  return viewAllMembersFlag.value ? members : members.slice(0, 7);
});

const back = () => {
  componentStore.rightTab = 'default';
};
const viewAllMembersFlag = ref(false);
const viewAllMembers = () => {
  viewAllMembersFlag.value = !viewAllMembersFlag.value;
  console.log('查看全部成员');
};

const addMember = () => {
  componentStore.showInviteDialog = true;
};

const kickMember = () => {
  componentStore.showKickDialog = true;
};

const showSetAdminDialog = () => {
  componentStore.showAdminDialog = true;
};

// 禁言管理弹窗
const muteDialogVisible = ref(false);
const muteSubmitting = ref(false);
const muteRightList = ref([]); // 已禁言/待禁言列表

// 角色权重：owner=0, admin=1, member=2
const roleWeight = (role) => {
  switch (role?.toLowerCase()) {
    case 'owner': return 0
    case 'admin': return 1
    default: return 2
  }
}

// 左侧：群成员中除去已在右侧的、不能看到自己、不能看到比自己权限高或相同的人
const muteLeftList = computed(() => {
  const rightIds = new Set(muteRightList.value.map(m => m.userId));
  const myUserId = accountStore.user?.id;
  const myWeight = roleWeight(currentUserRole.value);
  const members = currentRoom.value?.members || [];
  return members.filter(m => {
    if (rightIds.has(m.userId)) return false;
    // 不能看到自己
    if (String(m.userId) === String(myUserId)) return false;
    // 不能看到比自己权限高或相同的人
    if (roleWeight(m.role) <= myWeight) return false;
    return true;
  });
});

const showMuteDialog = () => {
  // 初始化右侧列表为当前已禁言的成员
  const members = currentRoom.value?.members || [];
  muteRightList.value = members.filter(m => m.isMuted === 1).map(m => ({ ...m }));
  muteDialogVisible.value = true;
};

const addToMuted = (member) => {
  muteRightList.value.push({ ...member });
};

const removeFromMuted = (member) => {
  const idx = muteRightList.value.findIndex(m => m.userId === member.userId);
  if (idx !== -1) muteRightList.value.splice(idx, 1);
};

const submitMute = async () => {
  muteSubmitting.value = true;
  try {
    const members = currentRoom.value?.members || [];
    const originalMutedIds = new Set(members.filter(m => m.isMuted === 1).map(m => m.userId));
    const newMutedIds = new Set(muteRightList.value.map(m => m.userId));

    // 新增禁言：原来没禁言，现在要禁言
    const toMuteUserIds = [...newMutedIds].filter(id => !originalMutedIds.has(id));
    // 解除禁言：原来禁言了，现在不在列表里
    const toUnmuteUserIds = [...originalMutedIds].filter(id => !newMutedIds.has(id));

    if (toMuteUserIds.length === 0 && toUnmuteUserIds.length === 0) {
      ElMessage.info('没有变更');
      muteDialogVisible.value = false;
      return;
    }

    if (toMuteUserIds.length > 0) {
      await chatRoomStore.batchMute({ chatRoomId: currentRoom.value.id, isMuted: 1, userIdList: toMuteUserIds });
    }
    if (toUnmuteUserIds.length > 0) {
      await chatRoomStore.batchMute({ chatRoomId: currentRoom.value.id, isMuted: 0, userIdList: toUnmuteUserIds });
    }

    // 更新本地成员禁言状态
    members.forEach(m => {
      m.isMuted = newMutedIds.has(m.userId) ? 1 : 0;
    });
    muteDialogVisible.value = false;
  } catch (error) {
    console.error('禁言操作失败:', error);
  } finally {
    muteSubmitting.value = false;
  }
};

const shareGroup = () => {
  console.log('分享群组');
};

const editNotice = () => {
  console.log('编辑群公告');
};
const editRemark = () => {
  console.log('编辑群备注');
};

const editJoinMethod = () => {
  console.log('编辑加群方式');
};

const exitGroup =async() => {
  await chatRoomStore.exitGroup(currentRoom.value.id);
};
const dismissGroup = async () => {
  ElMessageBox.confirm('确定解散群组？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    await chatRoomStore.dismissGroup(currentRoom.value.id);
  }).catch(() => {
  });
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
      position: relative;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.editable {
        cursor: pointer;

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          color: white;
          font-size: 11px;
          gap: 2px;
        }

        &:hover .avatar-overlay {
          opacity: 1;
        }
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

      .group-name-input {
        margin-bottom: 4px;

        :deep(.el-input__wrapper) {
          background-color: transparent;
          box-shadow: none;
          padding: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0;
        }

        :deep(.el-input__inner) {
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 0;

          &::placeholder {
            color: var(--text2);
            font-size: 13px;
          }
        }
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
      display: flex;
      align-items: center;

      &:hover {
        color: white;
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

          &.kick {
            background-color: rgba(245, 108, 108, 0.15);
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

      &.nickname-input-wrapper {
        flex: 1;
        max-width: 140px;

        :deep(.el-input__wrapper) {
          background-color: transparent;
          box-shadow: none;
          border: none;
          padding: 0;
        }

        :deep(.el-input__inner) {
          color: var(--text1);
          font-size: 13px;
          text-align: right;
          padding-right: 0;

          &::placeholder {
            color: var(--text2);
            font-size: 12px;
            text-align: right;
          }
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

<style lang="scss">
.mute-dialog {
  .el-dialog {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }

  .el-dialog__header {
    background-color: #f5f7fa;
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;
  }

  .el-dialog__title {
    color: #303133 !important;
    font-weight: 600;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: #909399 !important;

    &:hover {
      color: #303133 !important;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #e4e7ed;
  }

  .mute-dialog-body {
    display: flex;
    gap: 20px;
    min-height: 320px;

    .mute-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      border: 1px solid #e4e7ed;
      border-radius: 10px;
      overflow: hidden;
      background-color: #fafafa;

      .mute-panel-title {
        padding: 12px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        background-color: #f5f7fa;
        text-align: center;
        border-bottom: 1px solid #e4e7ed;
        letter-spacing: 1px;
      }

      .mute-panel-list {
        flex: 1;
        overflow-y: auto;
        padding: 6px;

        &::-webkit-scrollbar {
          width: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c0c4cc;
          border-radius: 2px;
        }
      }

      .mute-panel-empty {
        text-align: center;
        color: #c0c4cc;
        font-size: 12px;
        padding: 30px 0;
      }
    }

    .mute-member-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #ecf5ff;
      }

      .mute-member-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #e4e7ed;
      }

      .mute-member-name {
        flex: 1;
        font-size: 13px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>

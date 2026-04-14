<!-- SearchAddDialog.vue -->
<template>
    <el-dialog v-model="dialogVisible" title="搜索添加" width="480px" :close-on-click-modal="false"
        @close="handleClose">
        <div class="search-add-container">
            <!-- 搜索框 -->
            <div class="search-bar">
                <el-input v-model="keyword" placeholder="请输入用户名或群名称" clearable @keyup.enter="handleSearch"
                    prefix-icon="Search" />
                <el-button type="primary" @click="handleSearch" :loading="searching"
                    :disabled="!keyword.trim()">搜索</el-button>
            </div>

            <!-- Tab 切换 -->
            <el-segmented v-model="activeTab" :options="tabOptions" class="search-tab" />

            <!-- 搜索结果 -->
            <div class="search-results" v-if="searched">
                <el-scrollbar height="320px">
                    <!-- 好友结果 -->
                    <template v-if="activeTab === 'user'">
                        <div v-if="userList.length === 0" class="empty-tip">
                            <span>未找到相关用户</span>
                        </div>
                        <div v-for="user in userList" :key="user.id" class="result-item">
                            <img :src="user.avatar || defaultImg" alt="avatar" class="item-avatar">
                            <div class="item-info">
                                <span class="item-name">{{ user.nickname }}</span>
                                <span class="item-desc">{{ user.email || '' }}</span>
                            </div>
                            <el-button size="small" type="primary" @click="handleAddUser(user)"
                                :disabled="user.isFriend" :loading="user._adding">
                                {{ user.isFriend ? '已添加' : '添加好友' }}
                            </el-button>
                        </div>
                    </template>

                    <!-- 群聊结果 -->
                    <template v-if="activeTab === 'group'">
                        <div v-if="groupList.length === 0" class="empty-tip">
                            <span>未找到相关群聊</span>
                        </div>
                        <div v-for="group in groupList" :key="group.id" class="result-item">
                            <img :src="group.avatarUrl || defaultImg" alt="avatar" class="item-avatar">
                            <div class="item-info">
                                <span class="item-name">{{ group.name }}</span>
                                <span class="item-desc">{{ group.memberCount || 0 }}人</span>
                            </div>
                            <el-button size="small" type="primary" @click="handleJoinGroup(group)"
                                :disabled="group.isJoined" :loading="group._joining">
                                {{ group.isJoined ? '已加入' : '加入群聊' }}
                            </el-button>
                        </div>
                    </template>
                </el-scrollbar>
            </div>

            <!-- 未搜索时的提示 -->
            <div class="search-placeholder" v-else>
                <el-icon :size="48" color="#dcdfe6">
                    <Search />
                </el-icon>
                <span>输入关键词搜索好友或群聊</span>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useComponentStore } from '@/stores/ComponentStore'
import { useContactStore } from '@/stores/ContactStore'
import { useChatRoomStore } from '@/stores/ChatRoomStore'
import chat from '@/api/chat'
import defaultImg from '@/assets/default.png'
import { Search } from '@element-plus/icons-vue'

const componentStore = useComponentStore()
const contactStore = useContactStore()
const chatRoomStore = useChatRoomStore()

const dialogVisible = computed({
    get: () => componentStore.showSearchAddDialog,
    set: (val) => { componentStore.showSearchAddDialog = val }
})

const keyword = ref('')
const activeTab = ref('user')
const searching = ref(false)
const searched = ref(false)
const userList = ref([])
const groupList = ref([])

const tabOptions = [
    { label: '好友', value: 'user' },
    { label: '群聊', value: 'group' }
]

// 搜索
const handleSearch = async () => {
    const kw = keyword.value.trim()
    if (!kw) return

    searching.value = true
    searched.value = true
    try {
        const [userRes, groupRes] = await Promise.allSettled([
            chat.searchUsers(kw),
            chat.searchGroups(kw)
        ])

        // 用户列表，标记是否已是好友
        const friends = contactStore.contactList || []
        if (userRes.status === 'fulfilled' && userRes.value.data) {
            userList.value = userRes.value.data.map(u => ({
                ...u,
                isFriend: friends.some(f => f.contactId === u.id),
                _adding: false
            }))
        } else {
            userList.value = []
        }

        // 群聊列表，标记是否已加入
        const rooms = chatRoomStore.chatRoomList || []
        console.log('groupRes', groupRes)
        if (groupRes.status === 'fulfilled' && groupRes.value.data) {
            groupList.value = groupRes.value.data.map(g => ({
                ...g,
                isJoined: rooms.some(r => r.id === g.id),
                _joining: false
            }))
        } else {
            groupList.value = []
        }
    } catch (e) {
        console.error('搜索失败:', e)
    } finally {
        searching.value = false
    }
}

// 添加好友
const handleAddUser = async (user) => {
    user._adding = true
    try {
        await contactStore.requestContact(user.id)
        user.isFriend = true
    } catch (e) {
        console.error('添加好友失败:', e)
    } finally {
        user._adding = false
    }
}

// 加入群聊
const handleJoinGroup = async (group) => {
    group._joining = true
    try {
        await chatRoomStore.inviteMember({
            chatRoomId: group.id,
            userIdList: [] // 加入群聊由后端处理
        })
        group.isJoined = true
    } catch (e) {
        console.error('加入群聊失败:', e)
    } finally {
        group._joining = false
    }
}

// 关闭时重置
const handleClose = () => {
    keyword.value = ''
    activeTab.value = 'user'
    searched.value = false
    userList.value = []
    groupList.value = []
}
</script>

<style lang="scss" scoped>
.search-add-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 200px;

    .search-bar {
        display: flex;
        gap: 10px;

        .el-input {
            flex: 1;
        }
    }

    .search-tab {
        width: 100%;
    }

    .search-results {
        border-top: 1px solid #eee;
        padding-top: 12px;

        .result-item {
            display: flex;
            align-items: center;
            padding: 10px 8px;
            border-radius: 8px;
            transition: background 0.2s;

            &:hover {
                background: #f5f7fa;
            }

            .item-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                margin-right: 12px;
                flex-shrink: 0;
            }

            .item-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;

                .item-name {
                    font-size: 14px;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .item-desc {
                    font-size: 12px;
                    color: #999;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }

        .empty-tip {
            text-align: center;
            padding: 40px 0;
            color: #999;
            font-size: 14px;
        }
    }

    .search-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 60px 0;
        color: #c0c4cc;
        font-size: 14px;
    }
}
</style>

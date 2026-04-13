<template>
    <div class="notice-sidebar">
        <div class="title">通知</div>
        <div
            class="category-item"
            :class="{ active: activeCategory === cat.key }"
            v-for="cat in categories"
            :key="cat.key"
            @click="selectCategory(cat.key)"
        >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <span v-if="getUnread(cat.key) > 0" class="unread-dot">{{ getUnread(cat.key) > 99 ? '99+' : getUnread(cat.key) }}</span>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNoticeStore } from '@/stores/NoticeStore'

const emit = defineEmits(['select'])
const noticeStore = useNoticeStore()

const activeCategory = ref('FRIEND_INVITE')

const categories = [
    { key: 'FRIEND_INVITE', name: '好友通知', icon: '👤' },
    { key: 'GROUP_INVITE', name: '群通知', icon: '👥' },
    { key: 'SYSTEM_NOTICE', name: '系统通知', icon: '💻' },
]

const typeMap = {
    FRIEND_INVITE: 'FRIEND_INVITE',
    GROUP_INVITE: 'GROUP_INVITE',
    SYSTEM_NOTICE: 'SYSTEM_NOTICE',
}

const getUnread = (key) => noticeStore.getUnreadByType(typeMap[key] || key)

const selectCategory = (key) => {
    activeCategory.value = key
    emit('select', key)
}
</script>

<style lang="scss" scoped>
.notice-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;

    .title {
        background-color: var(--color-secondary);
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        color: white;
        border-radius: 10px;
        width: 97%;
        padding: 15px;
        margin-bottom: 10px;
    }

    .category-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px;
        width: 97%;
        border-radius: 10px;
        background: var(--color-third);
        color: white;
        cursor: pointer;
        margin-bottom: 8px;
        transition: background 0.2s;

        &:hover {
            background: #7aa8d9;
        }

        &.active {
            background: var(--selected);
        }

        .cat-icon {
            font-size: 18px;
        }

        .cat-name {
            flex: 1;
            font-size: 15px;
            font-weight: 500;
        }

        .unread-dot {
            min-width: 18px;
            height: 18px;
            line-height: 18px;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #fff;
            background: #f56c6c;
            border-radius: 9px;
            padding: 0 5px;
        }
    }
}
</style>

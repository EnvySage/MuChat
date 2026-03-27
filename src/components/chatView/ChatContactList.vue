<template>
    <el-scrollbar height="100%" @end-reached="loadMoreContact">
        <div class="warn" v-if="contactList.length <= 0">你还没有添加联系人哦</div>
        <div v-for="item in contactList" :key="item.id" class="scrollbar-demo-item" @click="selectContact(item)">
            <div class="avatar">
                <img :src="item.contactAvatar" alt=""></img>
            </div>
            <div class="content">
                <div class="name">{{ item.contactNickname }}</div>
                <div class="desc">{{ item.contactDescription }}</div>
            </div>
        </div>
    </el-scrollbar>
</template>

<script setup>
const props = defineProps({
    contactList: Array,
})
const emit = defineEmits(['loadMoreContact'])
const loadMoreContact = () => {
    emit('loadMoreContact')
}
const selectContact = (item) => {
    console.log(item)
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

        img {
            width: 100%;
            height: 100%;
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
</style>
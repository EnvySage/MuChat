import { defineStore } from "pinia";
import chat from "@/api/chat";
import { ref } from "vue";
import { ElMessage } from "element-plus";
export const useContactStore = defineStore("contact", () => {
    const contactList = ref()
    const getAllContact = async () => {
        try {
            const res = await chat.getAllContact()
            contactList.value = res.data
            console.log(res.data)
        } catch (err) {
            console.log(err)
        }
    }
    const addContact = async (contact) => {
        try {
            const res = await chat.addContact(contact)
            console.log(contact)
            if (res.code == 1) {
                await getAllContact()
                ElMessage.success('添加成功')
            } else {
                ElMessage.error('添加失败')
            }
        } catch (err) {
            console.log(err)
        }
    }
    const updateContact = async (contact) => {
        try {
            const res = await chat.updateContact(contact)
            console.log(contact)
            if (res.code == 1) {
                await getAllContact()
                ElMessage.success('添加成功')
            } else {
                ElMessage.error('添加失败')
            }
        } catch (err) {
            console.log(err)
        }
    }
    const deleteContact = async (contactId) => {
        try {
            const res = await chat.deleteContact(contactId)
            console.log(res)
            if (res.code == 1) {
                await getAllContact()
                ElMessage.success('删除成功')
            } else {
                ElMessage.error('删除失败')
            }
        } catch (err) {
            console.log(err)
        }
    }
    return {
        contactList,
        getAllContact,
        addContact,
        deleteContact
    }
})
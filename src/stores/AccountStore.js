import { defineStore } from "pinia";
import account from "@/api/account";
import { useComponentStore } from "./ComponentStore";
import { ref } from "vue";
export const useAccountStore = defineStore("account", () => {
    const user = ref(null);
    const componentStore = useComponentStore();
    const getCheckCode = async (type) => {
        const blob = await account.getCheckCode(type);
        const res = URL.createObjectURL(blob.data);
        console.log(res);
        return res;
    }
    const VerifyCheckCode = async (type, code) => {
        return await account.VerifyCode(type, code);
    };
    const SendEmailCode = async (email, checkCode, type) => {
        return await account.SendEmailCode(email, checkCode, type);
    }
    const RegisterUser = async (user) => {
        return await account.Register(user);
    }
    const LoginUser = async (user) => {
        const res = await account.Login(user);
        if (res.code == 1) {
            user.value = res.data;
            localStorage.setItem("token", user.value.token)
        }
        return res;
    }
    const VerifyToken = async (token) => {
        const res = await account.VerifyToken(token);
        if (res.code == 1) {
            user.value = res.data;

            localStorage.setItem("token", user.value.token)
        } else {
            console.error('Token验证失败:', error);
            localStorage.removeItem('token');
            ElMessage.error('登录验证失败，请重新登录');
            componentStore.showAuthDialog = true
            user.value = null
        }
    }
    return { getCheckCode, VerifyCheckCode, SendEmailCode, RegisterUser, LoginUser, VerifyToken, user };
}); 
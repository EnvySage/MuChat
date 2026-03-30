<!-- AvatarWithAuth.vue -->
<template>
    <div class="avatar-container" @click="handleLogin">
        <img :src="avatarSrc" :alt="altText" class="avatar-img">

        <!-- 登录注册对话框 -->
        <el-dialog v-model="showAuthDialog" :title="authMode === 'login' ? '登录' : '注册'" width="400px"
            :close-on-click-modal="false" :close-on-press-escape="false" destroy-on-close append-to-body>

            <el-form :model="authForm" :rules="authRules" ref="authFormRef" label-width="100px" size="default">
                <el-form-item label="用户名" prop="nickname">
                    <el-input v-model="authForm.nickname" placeholder="请输入用户名" @keyup.enter="submitAuth" />
                </el-form-item>

                <el-form-item label="密码" prop="password">
                    <el-input v-model="authForm.password" type="password" placeholder="请输入密码" show-password
                        @keyup.enter="submitAuth" />
                </el-form-item>

                <el-form-item v-if="authMode === 'login'" label="登录验证码" prop="loginCode" label-width="100px">
                    <el-input v-model="authForm.loginCode" style="width:50%" @keyup.enter="submitAuth" />
                    <img :src="LoginCodeImg" alt="登录验证码" style="width: 100px; height: 40px; " />
                </el-form-item>

                <!-- 注册时显示确认密码 -->
                <el-form-item v-if="authMode === 'register'" label="确认密码" prop="confirmPassword">
                    <el-input v-model="authForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password
                        @keyup.enter="submitAuth" />
                </el-form-item>
                <el-form-item v-if="authMode === 'register'" label="邮箱验证码" prop="emailCode" label-width="100px">
                    <el-input v-model="authForm.emailCode" style="width:50%" @keyup.enter="submitAuth" />
                    <p class="codeLink" @click="handleCode">获取验证码</p>
                </el-form-item>
            </el-form>


            <el-dialog title="邮箱验证" v-model="dialogInnerVisible" width="400px">
                <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="100px" size="default">
                    <el-form-item v-if="authMode === 'register'" label="邮箱" prop="email">
                        <el-input v-model="emailForm.email" @keyup.enter="submitEmail" />
                    </el-form-item>
                    <el-form-item v-if="authMode === 'register'" label="验证码" prop="emailCode">
                        <el-input v-model="emailForm.emailCode" @keyup.enter="submitEmail" style="width:50%" />
                        <img :src="EmailCodeImg" alt="发送邮箱验证码" style="width: 100px; height: 50px; margin-left: 10px;" />
                    </el-form-item>
                    <div slot="footer"
                        style="width: 100%; display: flex; justify-content: space-evenly; margin-top: 10px;">
                        <el-button @click="dialogInnerVisible = false">返回</el-button>
                        <el-button type="primary" @click="submitEmail">发送</el-button>
                    </div>
                </el-form>
            </el-dialog>


            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="toggleAuthMode">
                        {{ authMode === 'login' ? '还没有账号？去注册' : '已有账号？去登录' }}
                    </el-button>
                    <el-button type="primary" @click="submitAuth" :loading="submitting">
                        {{ authMode === 'login' ? '登录' : '注册' }}
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted,computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAccountStore } from '@/stores/AccountStore'
import { useComponentStore } from '@/stores/ComponentStore'
const componentStore = useComponentStore()

// 登录验证码
const accountStore = useAccountStore()
const LoginCodeImg = ref('')
const EmailCodeImg = ref('')
const Login = computed(() => {
    return accountStore.isLogin
})
onMounted(async () => {
    LoginCodeImg.value =await accountStore.getCheckCode(0)
})

const handleLogin = () => {
    if(Login.value){

    }else{
        componentStore.showAuthDialog = true
        accountStore.getCheckCode(0).then(res => {
            LoginCodeImg.value = res
        })
    }
}
const handleCode = () => {
    dialogInnerVisible.value = true
    accountStore.getCheckCode(1).then(res => {
        EmailCodeImg.value = res
    })
}
// Props
const props = defineProps({
    avatarSrc: {
        type: String,
        default: '@/assets/default.png'
    },
    altText: {
        type: String,
        default: '头像'
    }
})

// Emits
const emit = defineEmits(['login-success', 'register-success'])

// 控制对话框显示
const showAuthDialog = computed(() => componentStore.showAuthDialog)
const dialogInnerVisible = ref(false)
// 认证模式：'login' 或 'register'
const authMode = ref('login')
const email = ref('')
// 提交状态
const submitting = ref(false)
const emailForm = reactive({
    email: '',
    emailCode: ''
})
const emailRules = reactive({
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    emailCode: [
        { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
        { len: 5, message: '验证码长度为6位', trigger: 'blur' }
    ]
})

// 认证表单数据
const authForm = reactive({
    nickname: '',
    password: '',
    email: '',
    loginCode: '',      // 添加登录验证码
    emailCode: '',      // 添加邮箱验证码
    confirmPassword: '' // 添加确认密码
})
// 表单验证规则
const authRules = reactive({
    nickname: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== authForm.password) {
                    callback(new Error('两次输入的密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    loginCode: [
        { required: true, message: '请输入登录验证码', trigger: 'blur' }
    ],
    emailCode: [
        { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
        { len: 5, message: '验证码长度为5位', trigger: 'blur' }
    ]
})

// 表单引用
const emailFormRef = ref(null)
const authFormRef = ref(null)

// 切换认证模式
const toggleAuthMode = () => {
    authMode.value = authMode.value === 'login' ? 'register' : 'login'
    // 清空表单
    Object.keys(authForm).forEach(key => {
        authForm[key] = ''
    })
}
// 提交邮箱验证
// 提交邮箱验证
const submitEmail = async () => {
    try {
        // 先验证表单
        await emailFormRef.value.validate();

        // 验证验证码
        const verifyResult = await accountStore.SendEmailCode(emailForm.email, emailForm.emailCode, 0);
        if (verifyResult.code == 0) {
            ElMessage.error('验证码错误，请重新输入');
        } else {
            ElMessage.success('验证成功！请查看邮箱验证码');
            email.value = emailForm.email
            dialogInnerVisible.value = false;
        }
    } catch (error) {
        console.error('邮箱验证过程中出错:', error);

        // 检查是否是网络错误或API响应错误
        if (error.message === '响应数据格式异常') {
            ElMessage.error('服务器响应异常，请稍后再试');
        } else {
            ElMessage.error('请完整填写信息或验证码错误');
        }

        // 刷新验证码
        accountStore.getCheckCode(1).then(res => {
            EmailCodeImg.value = res;
        });
    }
};// 提交认证
const submitAuth = async () => {
    authForm.email = email.value
    try {
        // 根据当前模式确定要验证的字段
        let fieldsToValidate = [];
        if (authMode.value === 'login') {
            fieldsToValidate = ['nickname', 'password', 'loginCode'];
        } else {
            fieldsToValidate = ['nickname', 'email', 'password', 'confirmPassword', 'emailCode'];
        }
        console.log('验证字段', fieldsToValidate)
        await authFormRef.value.validateField(fieldsToValidate);

        // 设置提交状态
        submitting.value = true
        // 执行登录/注册逻辑
        if (authMode.value === 'login') {
            console.log('执行登录逻辑', authForm)
            await accountStore.LoginUser(authForm)
            const user = accountStore.user
            ElMessage.success('登录成功！')
            emit('login-success', authForm)
        } else {
            const res = await accountStore.RegisterUser(authForm)
            if (res.data.code == 0) {
                ElMessage.error('用户已存在')
            } else {
                ElMessage.success('注册成功！')
                emit('register-success', authForm)
            }

        }
        // 关闭对话框
        componentStore.showAuthDialog = false

    } catch (error) {
        console.error('表单验证失败:', error)
    } finally {
        submitting.value = false
        accountStore.getCheckCode(0).then(res => {
            LoginCodeImg.value = res;
        })
    }
}
</script>

<style scoped>
.avatar-container {
    padding: 5px;
    aspect-ratio: 1;
    width: 100%;
    cursor: pointer;
    position: relative;
    z-index: 1000;
}

.avatar-img {
    height: 100%;
    width: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.codeLink {
    cursor: pointer;
    color: var(--el-color-primary);
    font-size: 12px;
    margin-left: 10px;
    transition: color .3s;
}
</style>
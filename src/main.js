import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/styles/main.scss'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'  // 导入组件库
import 'element-plus/dist/index.css'  // 导入全局 CSS
const app = createApp(App)
app.use(ElementPlus)
app.use(createPinia())
app.use(router)

app.mount('#app')

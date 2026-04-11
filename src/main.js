import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/styles/main.scss'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'  // 导入组件库
import 'element-plus/dist/index.css'  // 导入全局 CSS
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus)
app.use(createPinia())
app.use(router)

app.mount('#app')

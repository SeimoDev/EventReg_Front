import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useTheme } from './utils/theme'

const app = createApp(App)
const { initTheme } = useTheme()

// 初始化主题
initTheme()

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')

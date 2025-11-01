import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style.css'
import './styles/common.css'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 添加全局错误处理，防止未捕获的错误导致页面刷新
app.config.errorHandler = (err, instance, info) => {
  console.error('全局错误:', err)
  console.error('错误信息:', info)
  console.error('组件实例:', instance)
  
  // 不刷新页面，只记录错误
  // 如果是开发环境，可以在控制台查看详细信息
}

// 监听未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 错误:', event.reason)
  // 阻止默认行为（可能会刷新页面）
  event.preventDefault()
})

// 监听未捕获的错误
window.addEventListener('error', (event) => {
  console.error('未捕获的错误:', event.error)
  // 不阻止默认行为，但记录错误
  return false
})

app.mount('#app')

import { insertElementIcons } from '@/utils'
import Vue from 'vue'
import App from './App.vue'
import ElementConfig from './config/element'

Vue.use(ElementConfig)

// 通过Chrome插件的API加载字体文件
insertElementIcons()
const app = (Vue.prototype.$app = new Vue(App).$mount())
document.querySelector('html').appendChild(app.$el)

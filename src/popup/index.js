import { Button, Card, Table, TableColumn, Input, Tag, Dialog } from 'element-ui'
import Vue from 'vue'
import AppComponent from './App/App.vue'

Vue.component('app-component', AppComponent)

Vue.use(Card)
Vue.use(Button)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Input)
Vue.use(Tag)
Vue.use(Dialog)

// eslint-disable-next-line no-new
new Vue({
    el: '#app',
    render: createElement => {
        return createElement(AppComponent)
    }
})

import { Button, Card, Table, TableColumn, Input, Tag } from 'element-ui'
import Vue from 'vue'
import AppComponent from './App/App.vue'

Vue.component('app-component', AppComponent)

Vue.use(Card)
Vue.use(Button)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Input)
Vue.use(Tag)

// eslint-disable-next-line no-new
new Vue({
    el: '#app',
    render: createElement => {
        return createElement(AppComponent)
    }
})

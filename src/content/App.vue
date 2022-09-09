<template>
    <div class="app-wrap">
        <div>
            <el-button round @click="stopAllFunc" type="warning">一键暂停</el-button>
        </div>
        <div style="margin-top: 16px" v-if="isHomePage">
            <el-button round @click="startFunc" type="success" v-if="autoMonitoringFlag === 0">启动监控</el-button>
            <el-button round @click="stopFunc" type="danger" v-else>停止监控</el-button>
            <el-button round @click="handleAmountAsync" type="primary">值校准</el-button>
            <el-button round @click="handleClick" type="primary">配置</el-button>
            <el-dialog title="配置" :visible.sync="showTable" width="30%">
                <h4>开启监控时，待支付跟支付金额得保持跟实时数据一样，不然可能会有bug</h4>
                <el-form ref="form" :model="formData" label-width="120px" size="mini">
                    <el-form-item label="待支付">
                        <el-input v-model="formData.willPayOrder"></el-input>
                    </el-form-item>
                    <el-form-item label="待发货">
                        <el-input v-model="formData.willDeliveryOrder"></el-input>
                    </el-form-item>
                    <el-form-item label="支付金额">
                        <el-input v-model="formData.amount"></el-input>
                    </el-form-item>
                    <el-form-item label="刷新时间间隔">
                        <el-input v-model="formData.delay" placeholder="单位：毫秒"></el-input>
                    </el-form-item>
                    <el-form-item label="标签页调用间隔">
                        <el-input v-model="formData.invokeInterval" placeholder="单位：毫秒"></el-input>
                    </el-form-item>
                </el-form>
                <span slot="footer" class="dialog-footer">
                    <el-button @click="showTable = false">取 消</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </span>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import '@/assets/less/index.less'
const DEFAULT_DELAY = 7000
const DEFAULT_INVOKE_INTERVAL = 600
export default {
    name: 'app',
    components: {},
    data() {
        return {
            storeName: '未知',
            showTable: false,
            autoMonitoringFlag: 0,
            timer: null,
            willPayOrder: '0',
            willDeliveryOrder: '0',
            amount: '0',
            delay: DEFAULT_DELAY,
            formData: {
                willPayOrder: '0',
                willDeliveryOrder: '0',
                amount: '0',
                delay: 0,
                invokeInterval: 0
            },
            isHomePage: location.href.includes('mms.pinduoduo.com/home')
        }
    },
    mounted() {
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission()
        }

        if (!this.isHomePage) return

        // 店铺名称
        if (document.querySelector('div.user-info-top > div.user-name > p.name')) {
            this.storeName = document.querySelector('div.user-info-top > div.user-name > p.name').innerText
        }

        // 待支付单数、待发货数
        if (document.querySelectorAll('.top-data-panel__card__value').length > 0) {
            const nodeList = document.querySelectorAll('.top-data-panel__card__value')
            this.willPayOrder = nodeList[0].innerText
            this.willDeliveryOrder = nodeList[1].innerText
        }

        // 支付金额
        if (document.querySelector('.manage-data__panel__card__content_val')) {
            this.amount = document.querySelector('.manage-data__panel__card__content_val').innerText
        }

        window.chrome.storage.local.get(['autoMonitoringFlag', 'willPayOrder', 'willDeliveryOrder', 'amount', 'delay'], data => {
            console.log('local', data)
            if (!data.willPayOrder || !data.amount || !data.willDeliveryOrder) {
                console.log('init')
                // 初始化数据
                this.delay = DEFAULT_DELAY
                window.chrome.runtime.sendMessage({
                    type: 'init',
                    willPayOrder: this.willPayOrder,
                    willDeliveryOrder: this.willDeliveryOrder,
                    amount: this.amount,
                    delay: this.delay
                })
            }

            this.autoMonitoringFlag = data.autoMonitoringFlag || 0

            if (this.autoMonitoringFlag === 1) {
                // 监测数据是否更新
                if (this.willPayOrder > data.willPayOrder || this.amount > data.amount || this.willDeliveryOrder > data.willDeliveryOrder) {
                    this.autoMonitoringFlag = 0
                    // 更新缓存
                    window.chrome.storage.local.set({
                        willPayOrder: this.willPayOrder,
                        willDeliveryOrder: this.willDeliveryOrder,
                        amount: this.amount,
                        autoMonitoringFlag: 0
                    })

                    window.chrome.runtime.sendMessage({
                        type: 'stop'
                    })

                    // 消息提醒
                    this.$notify({
                        title: `${new Date().toLocaleTimeString()}已触发停车`,
                        message: '记得检查直通车状态，以及重启起保证配置数据跟实时数据一致',
                        duration: 0,
                        offset: 150,
                        type: 'warning'
                    })
                    // 弹窗提示
                    // 检查用户是否同意接受通知
                    if (Notification.permission === 'granted') {
                        new Notification(this.storeName, {
                            body: '店铺中奖了，快点去看吧！'
                        })
                        // 通过弹新链接来唤醒窗口
                        // window.open('//www.baidu.com')
                    }
                } else {
                    // 没有数据更新继续监控
                    this.timer = setTimeout(() => {
                        location.reload()
                    }, this.delay)
                }
            }
        })
    },
    methods: {
        handleClick() {
            window.chrome.storage.local.get(['willPayOrder', 'willDeliveryOrder', 'amount', 'delay', 'invokeInterval'], data => {
                this.formData = Object.assign({ invokeInterval: DEFAULT_INVOKE_INTERVAL }, data)
            })
            this.toggleTable(true)
        },
        startFunc() {
            console.log('start monitor')
            this.autoMonitoringFlag = 1
            window.chrome.storage.local.set({
                autoMonitoringFlag: 1
            })
            location.reload()
        },
        stopFunc() {
            console.log('stop monitor')
            this.autoMonitoringFlag = 0
            window.chrome.storage.local.set({
                autoMonitoringFlag: 0
            })
            if (this.timer) {
                clearTimeout(this.timer)
            }
        },
        stopAllFunc() {
            // 一键暂停
            window.chrome.runtime.sendMessage({
                type: 'stop'
            })
        },
        toggleTable(status) {
            this.showTable = status
        },
        handleAmountAsync() {
            const nodeList = document.querySelectorAll('.top-data-panel__card__value')
            window.chrome.storage.local.set({
                willPayOrder: nodeList[0].innerText,
                willDeliveryOrder: nodeList[1].innerText,
                amount: document.querySelector('.manage-data__panel__card__content_val').innerText
            })
            this.$message({
                message: '校准成功！',
                type: 'success'
            })
        },
        async handleSubmit() {
            console.log('init')
            // 初始化数据
            window.chrome.runtime.sendMessage({
                type: 'init',
                ...this.formData
            })
            this.toggleTable(false)
            this.$message({
                message: '配置成功！',
                type: 'success'
            })
        }
    }
}
</script>

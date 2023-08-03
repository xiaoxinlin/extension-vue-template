<template>
    <div class="app-wrap">
        <div>
            <el-button round @click="stopAllFunc" type="warning">一键暂停</el-button>
        </div>
        <div style="margin-top: 16px" v-if="isGoodList">
            <el-button round @click="startFunc" type="success" v-if="autoMonitoringFlag === 0">启动监控</el-button>
            <el-button round @click="stopFunc" type="danger" v-else>停止监控</el-button>
            <el-button round @click="handleAmountAsync" type="primary">值校准</el-button>
            <el-button round @click="handleClick" type="primary">配置</el-button>
            <el-dialog title="配置" :visible.sync="showTable" width="30%">
                <h4>开启监控时，待支付跟支付金额得保持跟实时数据一样，不然可能会有bug</h4>
                <el-form ref="form" :model="formData" label-width="120px" size="mini">
                    <el-form-item label="页面总库存">
                        <el-input v-model="formData.stockCount"></el-input>
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
            stockCount: '0',
            delay: DEFAULT_DELAY,
            formData: {
                stockCount: '0',
                delay: 0,
                invokeInterval: 0
            },
            isGoodList: location.href.includes('mms.pinduoduo.com/goods/goods_list'),
        }
    },
    mounted() {
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission()
        }

        // 店铺名称
        if (document.querySelector('div.user-info-top > div.user-name > div.user-name-name > span.user-name-text')) {
            this.storeName = document.querySelector('div.user-info-top > div.user-name > div.user-name-name > span.user-name-text').innerText
        }
    },
    methods: {
        handleClick() {
            window.chrome.storage.local.get(['delay', 'invokeInterval', 'stockCount'], data => {
                this.formData = Object.assign({ invokeInterval: DEFAULT_INVOKE_INTERVAL }, data)
            })
            this.toggleTable(true)
        },
        _intervalFunc() {
            window.chrome.storage.local.get(['autoMonitoringFlag', 'delay', 'stockCount'], data => {
                if (!data.autoMonitoringFlag) return;
                this.timer = setTimeout(() => {
                    this.stockCount = 0
                    const stockEleList = [...document.querySelectorAll('div.TB_body_5-80-0 > div > table > tbody > tr > td:nth-child(10n + 4) > div:nth-child(1)')]
                    for (const ele of stockEleList) {
                        this.stockCount += +ele.innerText
                    }
                    this.stockCount = `${this.stockCount}`
                    console.log('监测更新', new Date(), this.stockCount, data.stockCount)
                    // 监测数据是否更新
                    if (this.stockCount < data.stockCount && this.stockCount != '0') {
                        this.autoMonitoringFlag = 0
                        // 更新缓存
                        window.chrome.storage.local.set({
                            stockCount: this.stockCount,
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
                        // 刷新数据
                        if (document.querySelector('div.TB_header_5-80-0.TB_headerSticky_5-80-0.TB_scrollbarOccupySpace_5-80-0 > table > thead > tr > th:nth-child(4)')) {
                            document.querySelector('div.TB_header_5-80-0.TB_headerSticky_5-80-0.TB_scrollbarOccupySpace_5-80-0 > table > thead > tr > th:nth-child(4)').click()
                        }
                        console.log('refresh', new Date())
                        // 没有数据更新继续监控
                        this._intervalFunc()
                    }
                }, data.delay)
            })
        },
        startFunc() {
            console.log('start monitor')
            this.autoMonitoringFlag = 1
            window.chrome.storage.local.set({
                autoMonitoringFlag: 1
            })
            this._intervalFunc()
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
            // 总库存
            this.stockCount = 0
            const stockEleList = [...document.querySelectorAll('div.TB_body_5-80-0 > div > table > tbody > tr > td:nth-child(10n + 4) > div:nth-child(1)')]
            for (const ele of stockEleList) {
                this.stockCount += +ele.innerText
            }
            this.stockCount = `${this.stockCount}`
            window.chrome.storage.local.set({
                stockCount: this.stockCount
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
        },
    }
}
</script>

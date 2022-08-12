<template>
    <div class="main_app">
        <h1>网络请求拦截规则配置</h1>
        <div>
            <el-button type="primary" @click="addOne()">添加</el-button>
            <el-button type="primary" @click="openOptions()">选项</el-button>
        </div>
        <el-table ref="multipleTable" :data="tableData" tooltip-effect="dark" style="width: 700px" max-height="400"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50"> </el-table-column>
            <el-table-column label="规则" width="400">
                <template slot-scope="scope">
                    <el-input v-model="scope.row.rule" placeholder="请输入内容" @change="handleInputChange(scope.row)">
                    </el-input>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
                <template slot-scope="scope">
                    <el-tag :type="scope.row.enabled ? 'success' : 'danger'" disable-transitions>{{ scope.row.enabled ?
                            '启用' : '禁用'
                    }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
                <template slot-scope="scope">
                    <el-button v-if="scope.row.enabled" size="mini" @click="toggleStatus([scope.row], false)">禁用
                    </el-button>
                    <el-button v-else size="mini" @click="toggleStatus([scope.row], true)">启用</el-button>
                    <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <div class="footer">
            <el-button @click="toggleStatus(multipleSelection, true)">批量启用</el-button>
            <el-button type="danger" @click="toggleStatus(multipleSelection, false)">批量禁用</el-button>
        </div>
        <el-dialog title="提示" :visible.sync="dialogVisible" width="80%">
            <div class="jsoneditor" ref="jsoneditor"></div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="importData()">导入</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import 'jsoneditor/dist/jsoneditor.css'
import JSONEditor from 'jsoneditor/dist/jsoneditor.js'
export default {
    name: 'app',
    data() {
        return {
            tableData: [],
            multipleSelection: [],
            dialogVisible: false,
            editor: null
        }
    },
    watch: {
        tableData: n => {
            console.log('watch tableData', n)
            window.chrome.storage.local.set({
                blockedHosts: n
            })
        }
    },
    created() {
        console.log('created')
        window.chrome.storage.local.get(['blockedHosts'], data => {
            if (!data.blockedHosts) return
            this.tableData = data.blockedHosts
        })
    },
    methods: {
        addOne() {
            this.tableData.push({
                rule: '',
                enabled: true
            })
        },
        handleInputChange() {
            this.tableData = [...this.tableData]
        },
        handleSelectionChange(val) {
            this.multipleSelection = val
        },
        toggleStatus(rows, status) {
            rows.forEach(row => {
                row.enabled = status || !row.enabled
            })
            this.tableData = [...this.tableData]
        },
        handleDelete(index) {
            this.tableData.splice(index, 1)
        },
        openOptions() {
            this.dialogVisible = true
            setTimeout(() => {
                if (this.$refs.jsoneditor && !this.editor) {
                    const options = {
                        modes: ['code', 'view']
                    }
                    this.editor = new JSONEditor(this.$refs.jsoneditor, options)
                }
                if (this.editor) {
                    this.editor.set(this.tableData)
                }
            }, 200)

        },
        importData() {
            const data = this.editor.get()
            console.log('import json', data)
            this.tableData = data
            this.dialogVisible = false
        }
    }
}
</script>

<style lang="less">
.main_app {
    width: 700px;
    height: 500px;
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;

    .jsoneditor {
        width: 100%;
        height: 300px;
    }

    .footer {
        margin-top: 20px;
    }
}
</style>

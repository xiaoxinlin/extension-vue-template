console.log('自动监控开始！每次只监控前5条数据，花费>20或者交易额>50就删除数据，监控间隔2秒钟~');
function startMonitor() {
    setTimeout(() => {
        console.log('start....');
        // 刷新表格
        document.querySelector('[class*=CustomTable_filterPanelWrapper_] .anq-dropdown-trigger').click();
        document.querySelector('[class*=CustomTable_filterPanelWrapper_] [class*=CustomSelect_isActive]').click();

        const timer = setInterval(() => {
            if (!document.querySelector('[class*="anq-spin-container anq-spin-blur"]')) {
                // 数据更新完了
                clearInterval(timer);

                // 获取列表计算数字是否超标（花费 > 20 || 交易额 > 50）
                const tableEL = document.querySelector('.anq-table-tbody');
                // 获取前5行计算，一次性也不可能来5单，有需要后面再改
                const top5Item = [...tableEL.querySelectorAll('.anq-table-row')].splice(1, 5);
                for (let i = 0; i < top5Item.length; i++) {
                    const nums = top5Item[i].querySelectorAll('[class*=reportConfig_tdNumber_]');
                    // 第一个是花费
                    const cost = nums[0].innerText;
                    // 第二个是交易额
                    const turnover = nums[1].innerText;
                    if (parseFloat(cost) > 20 || parseFloat(turnover) > 50) {
                        // 删除该项
                        console.log('**** 删除数据 *****');
                        top5Item[i].querySelector('.anq-dropdown-trigger').click();
                        document.querySelector('[class*=OperationsNewRow_moreOperationsItem_]:last-child').click();
                        document.querySelector('.anq-btn-dangerous').click();
                        break;
                    } else {
                        console.log(`==== 第${i+1}行数据 花费：${cost} 交易额：${turnover} PASS ====`)
                    }
                }

                console.log('end...');
                // 自循环
                startMonitor(); 
            }
        }, 50);
    }, 2000);
}
startMonitor();
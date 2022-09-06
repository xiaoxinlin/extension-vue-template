function isValidPattern(urlPattern) {
    var validPattern = /^(file:\/\/.+)|(https?|ftp|\*):\/\/(\*|\*\.([^\/*]+)|([^\/*]+))\//g
    return !!urlPattern.match(validPattern)
}

const handleBlockRequest = page => {
    console.log('page blocked - ' + page.url)

    return {
        cancel: true
    }
}

const updateFilter = urls => {
    if (!urls.length) return
    if (window.chrome.webRequest.onBeforeRequest.hasListener(handleBlockRequest)) {
        window.chrome.webRequest.onBeforeRequest.removeListener(handleBlockRequest)
    }
    const filter = {
        urls
    }
    const webRequestFlags = ['blocking']
    console.log('filter', filter, webRequestFlags)
    window.chrome.webRequest.onBeforeRequest.addListener(handleBlockRequest, filter, webRequestFlags)
}

// 初始化blockedHosts的值
chrome.storage.local.get(data => {
    console.log('get2', data)
    if (data.blockedHosts) {
        updateFilter(data.blockedHosts.filter(i => i.enabled && isValidPattern(i.rule)).map(i => i.rule))
    }
})

// 监听存储的变化
chrome.storage.onChanged.addListener(changeData => {
    console.log('changeData', changeData)
    let blockedHosts = changeData.blockedHosts.newValue
    updateFilter(blockedHosts.filter(i => i.enabled).map(i => i.rule))
})

const stopFunc = () => {
    window.chrome.tabs.query({}, tabs => {
        if (!!tabs.length) {
            tabs.forEach((tab, index) => {
                if (tab.url.includes('yingxiao.pinduoduo.com/marketing/main/center/odin/list')) {
                    window.chrome.tabs.executeScript(
                        tab.id,
                        {
                            code: `setTimeout(() => document.querySelector('.anq-modal-foot>.anq-btn-primary').click(), ${index * 400 + 100});`
                        }
                    )
                }
            })
        }
    })
}

function executeScript (obj) {
    console.log('bg', window.chrome.tabs, obj)
    if (obj.type === 'init') {
        window.chrome.storage.local.set({
            willPayOrder: obj.willPayOrder,
            amount: obj.amount,
            delay: obj.delay
        })
    } else if (obj.type === 'stop') {
        stopFunc()
    }
}
window.chrome.runtime.onMessage.addListener(executeScript)

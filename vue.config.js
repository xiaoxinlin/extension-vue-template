const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const path = require('path')

// Generate pages object
const pagesObj = {}
const chromeName = ['popup', 'options']

chromeName.forEach(name => {
    pagesObj[name] = {
        entry: `src/${name}/index.js`,
        template: 'public/index.html',
        filename: `${name}.html`
    }
})

// 生成manifest文件
const manifest = {}
if (process.env.NODE_ENV === 'production') {
    manifest.from = path.resolve('src/manifest.production.json')
    manifest.to = `${path.resolve('dist')}/manifest.json`
} else {
    manifest.from = path.resolve('src/manifest.development.json')
    manifest.to = `${path.resolve('dist')}/manifest.json`
}

const plugins = [new CopyWebpackPlugin([manifest])]

plugins.push(
    new CopyWebpackPlugin([
        {
            from: path.resolve('src/utils/background.js'),
            to: path.resolve('dist')
        },
        {
            from: path.resolve('src/assets/icons'),
            to: path.resolve('dist/icons')
        },
        {
            from: path.resolve('src/assets/js'),
            to: path.resolve('dist/js')
        }
    ])
)

// 开发环境将热加载文件复制到dist文件夹
if (process.env.NODE_ENV !== 'production') {
    plugins.push(
        new CopyWebpackPlugin([
            {
                from: path.resolve('src/utils/hot-reload.js'),
                to: path.resolve('dist')
            }
        ])
    )
}

// 生产环境打包dist为zip
if (process.env.NODE_ENV === 'production') {
    plugins.push(
        new ZipPlugin({
            path: path.resolve('dist'),
            filename: 'dist.zip'
        })
    )
}

module.exports = {
    pages: pagesObj,
    // // 生产环境是否生成 sourceMap 文件
    productionSourceMap: false,

    configureWebpack: {
        entry: {
            content: './src/content/index.js'
        },
        output: {
            filename: 'js/[name].js'
        },
        plugins
    },
    css: {
        extract: {
            filename: 'css/[name].css'
            // chunkFilename: 'css/[name].css'
        }
    },

    chainWebpack: config => {
        // 处理字体文件名，去除hash值
        const fontsRule = config.module.rule('fonts')

        // 清除已有的所有 loader。
        // 如果你不这样做，接下来的 loader 会附加在该规则现有的 loader 之后。
        fontsRule.uses.clear()
        fontsRule
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
            .use('url')
            .loader('url-loader')
            .options({
                limit: 1000,
                name: 'fonts/[name].[ext]'
            })

        // 查看打包组件大小情况
        if (process.env.npm_config_report) {
            config.plugin('webpack-bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
        }
    }
}

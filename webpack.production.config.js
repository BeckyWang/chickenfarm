const path = require('path');
const webpack = require('webpack');
const HtmlwebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const svgSpriteDirs = [
  require.resolve('antd-mobile').replace(/warn\.js$/, ''), // antd-mobile 内置svg
  path.resolve(__dirname, './src/asserts/icon'),  // 业务代码本地私有 svg 存放目录
];
const pxtorem = require('postcss-pxtorem');

const ant_design_theme = {
    "@brand-primary": "#28BB78",
    "@brand-primary-tap": "#75DCAD"
};

// const host = 'http://localhost:8087/';
const host = 'http://www.chickenfarm.com.cn/weixin/';

module.exports = {
    entry: {
        bundle: './src/cultivation.js',
        vendor: [
            'redux',
            'redux-thunk',
            'redux-immutable',
            'redux-actions',
            'react-redux',
            'react-router',
            'react-router-dom',
            'react-router-redux',
            'prop-types',
            'history/createBrowserHistory',
            'moment',
        ],
    },

    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: 'js/bundle.js',
        publicPath: host
    },

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: [path.resolve(__dirname, "src")],
                enforce: "post",
                use: [{
                    loader: "babel-loader",
                    options: {
                        presets: ["react", "env"],
                        plugins: ["transform-object-rest-spread", ["import", {
                            libraryName: "antd-mobile",
                            style: true, 
                        }]],
                    }
                }]
            }, {
                test: /\.scss$/,
                use: ["style-loader", "css-loader?modules", {
                    loader: 'postcss-loader',
                    options: {
                        plugins: [pxtorem({
                            rootValue: 50,
                            propList: ['*'],
                        })]
                    }
                }, "sass-loader"]
            }, {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    //resolve-url-loader may be chained before sass-loader if necessary
                    use: ['css-loader', {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [pxtorem({
                                rootValue: 100,
                                propList: ['*'],
                            })]
                        }
                    }, `less-loader?{"modifyVars":${JSON.stringify(ant_design_theme)}}`]
                })
            }, {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader']
                })
            }, {
                test: /\.svg$/,
                loader: 'svg-sprite-loader',
                include: svgSpriteDirs,
            }, {
                test: /\.(?:png|jpg|gif)$/,
                loader: 'url-loader?limit=8192&name=image/[hash].[ext]' //小于8k,内嵌;大于8k生成文件
            }
        ]
    },

    resolve: {
        mainFiles: ["index.web", "index"],
        modules: [
            "node_modules",
            path.resolve(__dirname, "src")
        ],
        extensions: [".web.js", ".js", ".jsx", ".json", ".less", ".scss", ".css"]
    },

    context: __dirname,

    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            mangle: true,
            // 最紧凑的输出
            beautify: false,
            // 删除所有的注释
            comments: false,
            // compress: true,
            compress: {
              // 在UglifyJs删除没有用到的代码时不输出警告  
              warnings: false,
              // 删除所有的 `console` 语句
              // 还可以兼容ie浏览器
              drop_console: true,
              // 内嵌定义了但是只用到一次的变量
              collapse_vars: true,
              // 提取出出现多次但是没有定义成变量去引用的静态值
              reduce_vars: true,
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'lib/[name].min.js',
        }),
        new CopyWebpackPlugin([{
            from: 'node_modules/babel-polyfill/dist/polyfill.min.js',
            to: 'lib/'
        }, {
            from: 'node_modules/react/dist/react.min.js',
            to: 'lib/'
        }, {
            from: 'node_modules/react-dom/dist/react-dom.min.js',
            to: 'lib/'
        }]),
        new HtmlwebpackPlugin({
            filename: 'cultivation.html',
            template: 'src/index.ejs',
            title: '土吉蛋',
            viewportPath: `${host}lib/antm-viewport.min.js`
        }),
        new HtmlWebpackIncludeAssetsPlugin({
            assets: [
                'lib/polyfill.min.js',
                'lib/react.min.js',
                'lib/react-dom.min.js',
            ],
            append: false,
        }),
        new HtmlWebpackIncludeAssetsPlugin({
            assets: [
                {path: 'http://pv.sohu.com/cityjson?ie=utf-8', type: 'js'},
                'http://res.wx.qq.com/open/js/jweixin-1.2.0.js'
            ],
            append: false,
            publicPath: ''
        }),
        new ExtractTextPlugin("lib/plugin.css")
    ]
};
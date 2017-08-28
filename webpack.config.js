const path = require('path');
const webpack = require('webpack');
const HtmlwebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const OpenBrowerPlugin = require('open-browser-webpack-plugin');
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

const port = 8082;
const host = `http://localhost:${port}/`;

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
        ]
    },

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: 'js/[name].js',
        publicPath: host
    },

    module: {
        rules: [{
            test: /\.jsx?$/,
            include: [path.resolve(__dirname, "src")],
            enforce: "post",
            use: [{
                loader: "babel-loader",
                options: {
                    presets: ["react", "es2017"],
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
            include: svgSpriteDirs,
            use: ['svg-sprite-loader'],
        }, {
            test: /\.(?:png|jpg|gif)$/,
            loader: 'url-loader?limit=8192&name=image/[hash].[ext]' //小于8k,内嵌;大于8k生成文件
        }]
    },

    resolve: {
        mainFiles: ["index.web", "index"],
        modules: [
            "node_modules",
            path.resolve(__dirname, "src")
        ],
        extensions: [".web.js", ".js", ".jsx", ".json", ".less", ".scss", ".css"]
    },

    devtool: "eval-source-map",

    context: __dirname,

    devServer: {
        proxy: { // proxy URLs to backend development server
            '/weixin/api/v1': 'http://localhost:8083/'
        },
        contentBase: [path.join(__dirname, "dist")],
        compress: true, // enable gzip compression
        historyApiFallback: true, // true for index.html upon 404, object for multiple paths
        hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
        port: port
    },

    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
    },

    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            names: ['vendor'],
            filename: 'lib/[name].min.js',
        }),
        new ExtractTextPlugin("lib/plugin.css"),
        new CopyWebpackPlugin([{
            from: 'node_modules/react/dist/react.min.js',
            to: 'lib/'
        }, {
            from: 'node_modules/react-dom/dist/react-dom.min.js',
            to: 'lib/'
        }]),
        new HtmlwebpackPlugin({
            filename: 'index.html',
            template: 'src/index.ejs',
            title: '土吉蛋',
            viewportPath: `${host}lib/antm-viewport.min.js`
        }),
        new HtmlWebpackIncludeAssetsPlugin({
            assets: [
                'lib/react.min.js',
                'lib/react-dom.min.js',
            ],
            append: false
        }),
        new HtmlWebpackIncludeAssetsPlugin({
            assets: [
                {path: 'http://pv.sohu.com/cityjson?ie=utf-8', type: 'js'},
                'http://res.wx.qq.com/open/js/jweixin-1.2.0.js'
            ],
            append: false,
            publicPath: ''
        }),
        new OpenBrowerPlugin({
            url: `${host}weixin/cultivation/farms`
        })
    ]
};
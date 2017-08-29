import React from 'react';
import { Link } from 'react-router-dom';
import { WingBlank, WhiteSpace, Icon, Button, Result, Flex, Toast } from 'antd-mobile';

import { getMyClients, getWXSignature } from '../../unit/fetch';
import Loading from '../public/Loading';
import { randomchar } from '../../unit/tool';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;
const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);

class Client extends React.Component {
    constructor() {
        super();

        this.state = {
        	clientList: [],
            loading: true,
            error: false,
        };
    }

    componentWillMount() {
        const { openId } = this.props;
		(async () => {
            try {
                this.setState({
                    clientList: await getMyClients(),
                    loading: false,
                })
            } catch(e) {
                this.setState({
                    loading: false,
                    error: true,
                })
            }
        })();

        if(!isIPhone) {
            (async () => {
                try {
                    const timestamp = +(new Date()).valueOf().toString().slice(0, 10);
                    const nonceStr = randomchar(32);
                    const {signature} = await getWXSignature({
                        timestamp, // 必填，生成签名的时间戳
                        noncestr: nonceStr, // 必填，生成签名的随机串
                        url: window.location.href,
                        jsapi_ticket: this.props.jsapiTicket
                    });
                    
                    wx.config({
                        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                        appId: 'wx20cc91f559b59b67', // 必填，公众号的唯一标识
                        timestamp, // 必填，生成签名的时间戳
                        nonceStr, // 必填，生成签名的随机串
                        signature,// 必填，签名，见附录1
                        jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                    });

                    wx.ready(() => {
                        wx.onMenuShareTimeline({
                            title: '土吉蛋', // 分享标题
                            link: `http://www.chickenfarm.com.cn/weixin/toFarms.html?referrer=${openId}`, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                            imgUrl: 'http://www.chickenfarm.com.cn/weixin/image/logo.png', // 分享图标
                            success: res => { // 用户确认分享后执行的回调函数
                                Toast.success('分享成功！', 2);
                            },
                        });

                        wx.onMenuShareAppMessage({
                            title: '土吉蛋', // 分享标题
                            link: `http://www.chickenfarm.com.cn/weixin/toFarms.html?referrer=${openId}`, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                            imgUrl: 'http://www.chickenfarm.com.cn/weixin/image/logo.png', // 分享图标
                            success: res => { // 用户确认分享后执行的回调函数                            
                                Toast.success('分享成功！', 2);
                            },
                        });
                    });
                } catch(e) {

                }
            })();
        }
         
    }

    render() {
    	const { clientList, loading, error } = this.state;
    	let bodyComponent = null;

    	const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                <span>我的客户</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;

    	if(loading) {
    		return <div className={styles['client-container']}>
                { headerComponent }
                <Loading tips='正在获取我的客户信息，请稍后...'/>
            </div>;
    	}

    	if(error) {
    		return <div className={styles['client-container']}>
                { headerComponent }
                <Result
	                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
	                title="获取失败"
	                message="网络错误，获取我的客户信息失败，请稍候再试！"
	            />
            </div>;
    	}

        return (
            <div className={styles['client-container']}>
                { headerComponent }
                { clientList.length ? <div>
	    			<Flex className={styles['table-header']}>
			            <span style={{width: '20%'}}>客户姓名</span>
			            <span style={{width: '20%'}}>购蛋总数</span>
			            <span style={{width: '20%'}}>购鸡总数</span>
			            <span style={{width: '20%'}}>当月购蛋</span>
			            <span style={{width: '20%'}}>当月购鸡</span>
			        </Flex>
			        <div style={{height: clientHeight * 4 / 5}} className={styles['client-info']}>
			        	{
				        	clientList.map(({uid, realname, totalEggs, curMonthEggs, totalChicken, curMonthChicken}) => <Flex className={styles['row']}>
				                <span style={{width: '20%'}}>{realname}</span>
					            <span style={{width: '20%'}}>{totalEggs}</span>
					            <span style={{width: '20%'}}>{totalChicken}</span>
					            <span style={{width: '20%'}}>{curMonthEggs}</span>
					            <span style={{width: '20%'}}>{curMonthChicken}</span>
				            </Flex>)
				        }
			        </div>
	    		</div> : <Result
	                img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
	                title="提示"
	                message="您还没有客户，可通过开发新客户获得财富！"
	            />}
            </div>
        );
    }
}

export default Client;
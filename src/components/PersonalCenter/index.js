import React from 'react';
import { Link } from 'react-router-dom';
import { WingBlank, WhiteSpace, Icon, Button, Result, Grid, Toast } from 'antd-mobile';

import { getUserInfo, getWXSignature } from '../../unit/fetch';
import Loading from '../public/Loading';
import { randomchar } from '../../unit/tool';

import styles from './styles';
const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);

class PersonalCenter extends React.Component {
    constructor() {
        super();

        this.state = {
            isUser: true,
        	personalInfo: {},
            loading: true,
            error: false,
        };

        this.gridData = [{
        	icon: require('../../asserts/icon/money.svg'),
        	text: '我的财富',
        	link: '/weixin/cultivation/person_center/treasure',
        }, {
        	icon: require('../../asserts/icon/users.svg'),
        	text: '我的客户',
        	link: '/weixin/cultivation/person_center/client',
        }, {
        	icon: require('../../asserts/icon/address.svg'),
        	text: '我的地址',
        	link: '/weixin/cultivation/address/manage',
        }];

        this.getUserInfo = this.getUserInfo.bind(this);
    }

    async getUserInfo(openId) {
        try {
            this.setState({
                personalInfo: await getUserInfo(openId),
                loading: false,
            })
        } catch(e) {
            this.setState({
                loading: false,
                error: true,
            })
        }
    }

    async shareConfig(openId, jsapiTicket) {
        if(isIPhone) {
            (async () => {
                try {
                    const timestamp = +(new Date()).valueOf().toString().slice(0, 10);
                    const nonceStr = randomchar(32);
                    const {signature} = await getWXSignature({
                        timestamp, // 必填，生成签名的时间戳
                        noncestr: nonceStr, // 必填，生成签名的随机串
                        url: window.location.href,
                        jsapi_ticket: jsapiTicket
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

    componentWillMount() {
        const { isUser, openId, jsapiTicket } = this.props;
    	if(isUser && openId) {
    		this.getUserInfo();
            this.shareConfig(openId, jsapiTicket);
    	}
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.isUser !== this.props.isUser) {
            const { isUser, openId, jsapiTicket } = nextProps;
            isUser ? this.getUserInfo(openId) : this.setState({
                loading: false,
                isUser: false,
            }); 
            this.shareConfig(openId, jsapiTicket);
        }
    }

    render() {
    	const { personalInfo, loading, error, isUser } = this.state;
    	const { realname } = personalInfo;

    	const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <sapn></sapn>
                <span>个人中心</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;

        if(loading) {
            return <div className={styles['personal-center-container']}>
                { headerComponent }
                <Loading tips='正在获取个人信息，请稍后...'/>
            </div>;
        }

        if(!isUser) {
    		return <div className={styles['personal-center-container']}>
                { headerComponent }
                <div>
                	<Result
		                img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
		                title="提示"
		                message="您还不是我们的会员，现在去注册会员？"
		            />
            		<WhiteSpace size='lg'/>
	        		<Button type="primary" onClick={() => {this.props.history.push('/weixin/cultivation/register')}}>去注册</Button>
                </div>
            </div>;
    	}

        return (
            <div className={styles['personal-center-container']}>
                { headerComponent }
                { error ? <Result
	                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
	                title="获取失败"
	                message="网络错误，获取个人信息失败，请稍候再试！"
	            /> : <div>
	    			<div className={styles['welcome-tip']}>
	    				{realname}，欢迎您！
	    			</div>
	    			<Grid 
	    				data={this.gridData} 
	    				columnNum={3} 
	    				renderItem={({icon, link, text}) => (
							<Link to={link} className={styles['item']}>
								<Icon type={icon} style={{ width: '0.9rem', height: '0.9rem' }} />
								<div className={styles['item-title']}>
									<span>{text}</span>
								</div>
							</Link>
						)}
	    			/>
	    		</div> }
            </div>
        );
    }
}

export default PersonalCenter;
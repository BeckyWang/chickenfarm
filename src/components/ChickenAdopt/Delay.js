import React from 'react';
import { createForm } from 'rc-form';
import { WingBlank, WhiteSpace, Flex, Result, Icon, InputItem, List, Button, Toast } from 'antd-mobile';

import { randomchar } from '../../unit/tool';
import { getChickenInfo, getWXSignature, delayChicken } from '../../unit/fetch';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;

class ChickenDelay extends React.Component {
    constructor() {
        super();

        this.state = {
            chickenName: '',
            dailyspending: 0,
        	totalMoney: 0,
        	paySuccess: false,
        }

        this.onChangeDays = this.onChangeDays.bind(this);
        this.toDelay = this.toDelay.bind(this);
    }

    componentWillMount() {
        const { chickenId } = this.props.location.state;

        (async () => {
            try {
                const { dailyspending, cname } = await getChickenInfo(chickenId);
                this.setState({
                    chickenName: cname,
                    dailyspending,
                });
            } catch({info = '获取鸡只信息失败，请稍候再试！'}) {
                Toast.fail(info, 2);
            }
        })();

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
                    jsApiList: ['chooseWXPay'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                });
            } catch(e) {

            }
        })();
    }

    toDelay() {
        const { chickenId } = this.props.location.state;

    	this.props.form.validateFields(async (errors, values) => {
            if(!errors) {
            	try {
            		const { prepay_id } = await delayChicken(chickenId, {adopt_days: +values.delayDays});
            		const timestamp = +(new Date()).valueOf().toString().slice(0, 10);
                    const nonceStr = randomchar(32);
                    const { signature: paySign } = await getWXSignature({
                        appId: 'wx20cc91f559b59b67',
                        timeStamp: timestamp,
                        nonceStr,
                        package: `prepay_id=${prepay_id}`,
                        signType: 'MD5',
                    });

                     wx.chooseWXPay({
                        appId: 'wx20cc91f559b59b67',
                        timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                        nonceStr, // 支付签名随机串，不长于 32 位
                        package: `prepay_id=${prepay_id}`, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                        signType: 'MD5', // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                        paySign, // 支付签名
                        success: res => {
                            //支付成功后跳转
                            this.setState({
                            	paySuccess: true,
                            });
                        }
                    });

            	} catch({info='发起支付出错，请稍候再试！'}) {
            		Toast.fail(info, 2);
            	}
            }
        });
    }

    onChangeDays(v) {
        const { dailyspending } = this.state;
		this.setState({
			totalMoney: (v * dailyspending).toFixed(2)
		});

    }

    render() {
        const { totalMoney, paySuccess, dailyspending, chickenName } = this.state;
        const { getFieldProps, getFieldError } = this.props.form;

        if(paySuccess) {
        	return <div>
	        	<WhiteSpace size='lg'/>
	        	<WhiteSpace size='lg'/>
	        	<Result
					img={<Icon type="check-circle" className={styles['error-tip']} style={{ fill: '#28BB78' }} />}
					title="支付成功"
					message="您已成功延长认养鸡只，可到“我的认养”中查看详情。"
				/>
				<Button type="primary" className={styles['submit-button']} onClick={() => this.props.history.goBack()}>我知道了</Button>
	        </div>;
        }

        return ( 
        	<div className={styles['adopt-protocol-container']}>
	           	<div>
	        		<WhiteSpace size='lg'/>
	        		<WingBlank className={styles['public-header']}>
		            	<sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
	                    <span>延长认养</span>
	                    <span></span>
		            </WingBlank>
	        		<WhiteSpace size='lg'/>
	        		<WingBlank>
                        <span className={styles['second-header']}>鸡只：{chickenName}</span>
                    </WingBlank>
	        		<WhiteSpace size='lg'/>
	        	</div>

	        	<List style={{fontSize: '14px'}}>
	        		<InputItem
	        			{...getFieldProps('delayDays', {
	        				rules: [{required: true, message: '延长天数不能为空!'}],
							normalize: (v) => {
								if (v && (v.charAt(0) === '0' || v.indexOf('.') >= 0)) {
									return v.replace(/^0*(\d*).*$/, '$1');
								}
								return v;
							},
							onChange: this.onChangeDays,
						})}
	        			type="money"
						placeholder="请输入延长天数"
						labelNumber={7}
						error={!!getFieldError('delayDays')}
						onErrorClick={() => {
							Toast.fail(getFieldError('delayDays'), 1);
						}}
					>延长天数（天）</InputItem>

	                <List.Item extra={`${dailyspending}`}>
	                    <Flex justify="between">
	                        <span>日花销（元）</span>
	                    </Flex>
	                </List.Item>
					<List.Item extra={`${totalMoney}`}>
						<Flex justify="between">
							<span>支付总额（元）</span>
						</Flex>
					</List.Item>
	        	</List>
				<Button type="primary" className={styles['submit-button']} onClick={this.toDelay}>确认延长认养</Button>
	            <WhiteSpace size='lg'/>
	        </div>
	    );
    }
}

export default createForm()(ChickenDelay);
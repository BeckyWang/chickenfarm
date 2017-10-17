import React from 'react';
import { WingBlank, WhiteSpace, Flex, Result, Icon, List, Button, Toast, Radio } from 'antd-mobile';

import { randomchar } from '../../unit/tool';
import { getWXSignature, buyEgg } from '../../unit/fetch';

import styles from './styles';

const RadioItem = Radio.RadioItem;

const clientHeight = document.documentElement.clientHeight;
const logisticsList = [
    { value: '普通快递', label: '普通快递（包邮）' },
    { value: '顺丰', label: '顺丰快递（到付）' },
];

class EggOrderPay extends React.Component {
    constructor() {
        super();

        this.state = {
            logistics: '普通快递',
            paySuccess: false,
        }

        this.toPay = this.toPay.bind(this);
        this.toSelectAddress = this.toSelectAddress.bind(this);
        this.onSelectLogistics = this.onSelectLogistics.bind(this);
    }

    componentWillMount() {
        (async () => {
            try {
                const timestamp = new Date().valueOf().toString().slice(0, 10);
                const nonceStr = randomchar(32);
                const {signature} = await getWXSignature({
                    timestamp, // 必填，生成签名的时间戳
                    noncestr: nonceStr, // 必填，生成签名的随机串
                    url: window.location.href.split('#')[0],
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

    onSelectLogistics(val) {
        this.setState({
            logistics: val,
        });
    }

    async toPay() {
        const { logistics } = this.state;
        const { orderId } = this.props.location.state;

        if(!this.props.address.raid) {
            Toast.info('请选择一个收货地址！', 2);
            return;
        }

    	try {
    		const { prepay_id } = await buyEgg({addressId: this.props.address.raid, logistics, orderId});
    		const timestamp = new Date().valueOf().toString().slice(0, 10);
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

    toSelectAddress() {
        this.props.history.push('/weixin/cultivation/address');
    }

    render() {
    	const { totalPrice } = this.props.location.state;
        const { logistics, paySuccess } = this.state;
        const { address } = this.props;

        if(paySuccess) {
            return <div>
                <WhiteSpace size='lg'/>
                <WhiteSpace size='lg'/>
                <Result
                    img={<Icon type="check-circle" className={styles['error-tip']} style={{ fill: '#28BB78' }} />}
                    title="支付成功"
                    message={`您已成功购买30个鸡蛋！`}
                />
                <WhiteSpace size='lg'/>
                <Button type="primary" className={styles['submit-button']} onClick={() => this.props.history.goBack()}>我知道了</Button>
            </div>;
        }
        
        return ( <div className={styles['egg-pay-container']}>
        	<div>
                <WhiteSpace size='lg'/>
                <WingBlank className={styles['public-header']}>
                    <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                    <span>鸡蛋订购</span>
                    <span></span>
                </WingBlank>
                <WhiteSpace />
            </div>

           <WingBlank className={styles['second-header']}>
                <span><Icon type={require('../../asserts/icon/icon_step2.svg')} className={styles['second-header-icon']}/>付款</span>
                <span onClick={() => this.props.history.goBack()}>上一步</span>
            </WingBlank>

            <div>
	        	<WhiteSpace size='lg'/>
                <WingBlank>
        			<Flex justify="between" className={styles['address-title']} onClick={() => this.toSelectAddress()}>
                        <span>收货地址</span>
                        <Icon type="right" />
                    </Flex>
                    <WhiteSpace />
                    { address.raid ? <div>
                        <Flex justify="between" className={styles['font-14']}>
                            <Flex.Item>收货人：{address.consignee}</Flex.Item>
                            <Flex.Item>{address.phone}</Flex.Item>
                        </Flex>
                        <WhiteSpace />
                         <Flex justify="between" className={styles['font-14']}>
                            <span className={styles['address-info']}>地址：{address.address}</span>
                        </Flex>
                    </div> : <div className={styles['no-address']}>请选择一个收货地址！</div> }
        		</WingBlank>
        		<WhiteSpace size='lg'/>
        	</div>

        	<div>
                <WhiteSpace size='lg'/>
                <List renderHeader={() => <span className={styles['logistics-title']}>选择快递方式</span>}>
                    { logisticsList.map(i => (
                        <RadioItem key={i.value} checked={logistics === i.value} onChange={() => this.onSelectLogistics(i.value)}>
                            <span className={styles['font-16']}>{i.label}</span>
                        </RadioItem>
                    )) }
                </List>
                <WhiteSpace size='lg'/>
            </div>

            <div className={styles['btn-groups']}>
                <span style={{color: '#28BB78'}}>合计：{totalPrice}元</span>
                <Button type="ghost" inline size="small" className={styles['button']} onClick={() => this.props.history.goBack()}>取消</Button>
                <Button type="primary" inline size="small" className={styles['button']} onClick={this.toPay}>确认</Button>  
            </div>  
        </div>);
    }
}

export default EggOrderPay;
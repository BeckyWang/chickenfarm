import React from 'react';
import { createForm } from 'rc-form';
import { WingBlank, WhiteSpace, Flex, Result, Icon, Checkbox, InputItem, List, Button, Toast } from 'antd-mobile';

import { randomchar } from '../../unit/tool';
import { getChickenInfo, getWXSignature, adoptChicken } from '../../unit/fetch';

import styles from './styles';

const AgreeItem = Checkbox.AgreeItem;

const clientHeight = document.documentElement.clientHeight;

class ChickenAdopt extends React.Component {
    constructor() {
        super();

        this.state = {
            chickenName: '',
            dailyspending: 0,
            deposit: 0,
        	totalAdoptedMoney: null,
        	paySuccess: false,
        }

        this.onChangeDays = this.onChangeDays.bind(this);
        this.toAdopt = this.toAdopt.bind(this);
    }

    componentWillMount() {
        const { chickenId } = this.props.location.state;

        (async () => {
            try {
                const { dailyspending, deposit, cname } = await getChickenInfo(chickenId);
                this.setState({
                    chickenName: cname,
                    dailyspending,
                    deposit,
                    totalAdoptedMoney: 0 * dailyspending + deposit,
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

    toAdopt() {
        const { chickenId } = this.props.location.state;

    	this.props.form.validateFields(async (errors, values) => {
            if(!errors) {
            	if(values.adoptedDays < 30) {
            		Toast.fail('认养天数不能少于30天', 2);
            		return;
            	}

            	try {
            		const { prepay_id } = await adoptChicken(chickenId, {adopt_days: +values.adoptedDays});
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
                        // appId: 'wx20cc91f559b59b67',
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
        const { dailyspending, deposit } = this.state;
		this.setState({
			totalAdoptedMoney: v * dailyspending + deposit
		});

    }

    render() {
        const { totalAdoptedMoney, paySuccess, dailyspending, deposit, chickenName } = this.state;
        const { getFieldProps, getFieldError } = this.props.form;

        return ( paySuccess ? <div>
        	<WhiteSpace size='lg'/>
        	<WhiteSpace size='lg'/>
        	<Result
				img={<Icon type="check-circle" className={styles['error-tip']} style={{ fill: '#28BB78' }} />}
				title="支付成功"
				message="您已成功认养鸡只，可到“我的认养”中查看详情。"
			/>
			<Button type="primary" className={styles['submit-button']} onClick={() => this.props.history.goBack()}>我知道了</Button>
        </div> : <div className={styles['adopt-protocol-container']}>
           	<div>
        		<WhiteSpace size='lg'/>
        		<WingBlank className={styles['public-header']}>
	            	<sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                    <span>认养协议</span>
                    <span></span>
	            </WingBlank>
        		<WhiteSpace size='lg'/>
        	</div>
        	<pre style={{height: clientHeight * 2 / 5}} className={styles['protocol']}>
        		<p>认养是对相应鸡只进行承包。认养者需承担鸡的部分成本和认养期内的每日花销。</p>
                <p>甲方：认养者   乙方：土吉农牧</p>
                <p>甲乙双方就编号为{chickenName}鸡只的认养事宜，达成一致意见，具体内容如下：</p>
                <p>1.甲方对某鸡只进行认养时，先支付该鸡只的部分成本和该鸡只在认养期内的每日花销。</p>
                <p>2.甲方在自行指定的认养期限内，不得取消认养。如若甲方强行终止认养，其所预付费用乙方不予以退还。</p>
                <p>3.首次认养期不得低于30天。甲方在30天之内（含30天），不可收割鸡只，30天之后，可以认养期内的鸡只进行收割和销售。</p>
                <p>4.认养期间，该母鸡的所有权归甲方。乙方不得将该母鸡出售，或转为他人认养。</p>
                <p>5.认养期间，被认养母鸡所产鸡蛋的所有权归认养者。除去一定的成本后，鸡蛋销售利润归认养者所有。</p>
                <p>6.甲方可对认养期内的鸡只进行“鸡蛋自留”操作。“鸡蛋自留”状态的鸡只所产的蛋，由甲方自行承担，自行处理，乙方系统不将该鸡只所产的蛋分配到任何除甲方之外的消费者订单。</p>
                <p>7.每个鸡蛋的销售期为5天，5天之后8天之前的鸡蛋系统统一打折降价处理，8天之后的鸡蛋由鸡场统一下架处理。所有未售出的鸡蛋由系统或鸡场统一安排处理，甲方不得提出任何特殊处理的请求。</p>
                <p>8.认养期间，鸡只如死亡或失踪，甲方所支付的相应成本，以及该鸡只死亡或失踪前的日花销不予退还。鸡只死亡或失踪日期之后的日花销成本，乙方应予以退还。死亡或失踪日期根据系统对该鸡只的检测结果而定。</p>	
        	</pre>
        	<div>
        		<AgreeItem 
        			{...getFieldProps('agree', {
        				rules: [{required: true, message: '认养天数不能为空!'}],
					})}
				>
	            	我已阅读，并同意该认养协议
	         	</AgreeItem>
        	</div>
        	<List style={{fontSize: '14px'}}>
        		<InputItem
        			{...getFieldProps('adoptedDays', {
        				rules: [{required: true, message: '认养天数不能为空!'}],
						normalize: (v) => {
							if (v && (v.charAt(0) === '0' || v.indexOf('.') >= 0)) {
								return v.replace(/^0*(\d*).*$/, '$1');
							}
							return v;
						},
						onChange: this.onChangeDays,
					})}
        			type="money"
					placeholder="不得低于30天"
					labelNumber={7}
					error={!!getFieldError('adoptedDays')}
					onErrorClick={() => {
						Toast.fail(getFieldError('adoptedDays'), 1);
					}}
				>认养天数（天）</InputItem>
				
				<List.Item extra={`${deposit}`}>
					<Flex justify="between">
						<span>押金（元）</span>
					</Flex>
				</List.Item>
                <List.Item extra={`${dailyspending}`}>
                    <Flex justify="between">
                        <span>日花销（元）</span>
                    </Flex>
                </List.Item>
				<List.Item extra={`${totalAdoptedMoney}`}>
					<Flex justify="between">
						<span>支付总额（元）</span>
					</Flex>
				</List.Item>
        	</List>
			<Button type="primary" className={styles['submit-button']} onClick={this.toAdopt}>确认认养</Button>
            <WhiteSpace size='lg'/>
        </div>);
    }
}

export default createForm()(ChickenAdopt);
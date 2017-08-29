import React from 'react';
import { WingBlank, WhiteSpace, Flex, Result, Icon, List, Button, Toast, Radio } from 'antd-mobile';

import { randomchar } from '../../unit/tool';
import { getChickenInfo, getWXSignature, buyChicken } from '../../unit/fetch';

import styles from './styles';

const RadioItem = Radio.RadioItem;

const clientHeight = document.documentElement.clientHeight;
const logisticsList = [
    { value: '普通快递', label: '普通快递（包邮）' },
    { value: '顺丰', label: '顺丰快递（到付）' },
];

class ChickenEat extends React.Component {
    constructor() {
        super();

        this.state = {
        	paySuccess: false,
        	chicken: {},
            logistics: '普通快递',
        }

        this.toPay = this.toPay.bind(this);
        this.toSelectAddress = this.toSelectAddress.bind(this);
        this.onSelectLogistics = this.onSelectLogistics.bind(this);
    }

    componentWillMount() {
        const { chickenId } = this.props.location.state;
 
    	(async () => {
    		try {
    			this.setState({
    				chicken: await getChickenInfo(chickenId),
    			});
    		} catch({info = '获取鸡只信息失败，请稍候再试！'}) {
	    		Toast.fail(info, 2);
    		}
    	})();
    }

    onSelectLogistics(val) {
        this.setState({
            logistics: val,
        });
    }

    async toPay() {
        const { chicken, logistics } = this.state;

        if(!this.props.address.raid) {
            Toast.info('请选择一个收货地址！', 2);
            return;
        }

    	try {
    		await buyChicken(chicken.cid, {addressId: this.props.address.raid, logistics, });
            this.setState({
                paySuccess: true,
            });
    	} catch({info='购买出错，请稍候再试！'}) {
    		Toast.fail(info, 2);
    	}          
    }

    toSelectAddress() {
        this.props.history.push('/weixin/cultivation/address');
    }

    render() {
        const { paySuccess, chicken, logistics } = this.state;
        const { cid, price, sex, breed, age, cname, dailyspending } = chicken;
        const { address } = this.props;
        const { restDays } = this.props.location.state;
        const returnMoney = (dailyspending * restDays).toFixed(2);

        return ( paySuccess ? <div>
        	<WhiteSpace size='lg'/>
        	<WhiteSpace size='lg'/>
        	<Result
				img={<Icon type="check-circle" className={styles['error-tip']} style={{ fill: '#28BB78' }} />}
				title="购买成功"
				message={`您已成功购买编号为${cname}的鸡只，剩余日花销${returnMoney}元已退还到您的财富里。`}
			/>
			<Button type="primary" className={styles['submit-button']} onClick={() => this.props.history.goBack()}>我知道了</Button>
        </div> : <div className={styles['chicken-order-container']}>
           	<div>
        		<WhiteSpace size='lg'/>
        		<WingBlank className={styles['public-header']}>
	            	<sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                    <span>确认订单</span>
                    <span></span>
	            </WingBlank>
        		<WhiteSpace size='lg'/>
        	</div>

        	<div className={styles['order-info']}>
	        	<WhiteSpace size='lg'/>
	        	<WingBlank>
		        	<Flex justify="between" className={styles['title']}>
                        <span>鸡只信息</span>
                    </Flex>
        			<WhiteSpace />
        			<Flex justify="between" className={styles['font-14']}>
                        <span>编号：{cname}（{sex}鸡）</span>
                    </Flex>
	                <WhiteSpace />
                    <Flex justify="between" className={styles['font-14']}>
	                    <Flex.Item>品种：{breed}</Flex.Item>
	                    <Flex.Item>日龄：{age}天</Flex.Item>
	                </Flex>
	                <WhiteSpace />
                    <Flex justify="between" className={styles['font-14']}>
                        <Flex.Item>日花销：{dailyspending}</Flex.Item>
                        <Flex.Item>剩余认养天数：{restDays}天</Flex.Item>
                    </Flex>
                    <WhiteSpace />
	                <Flex justify="between" className={styles['font-14']}>
                        <span>售价：{price}元</span>
                    </Flex>
	        	</WingBlank>
	        	<WhiteSpace size='lg'/>
        	</div>

        	<div>
	        	<WhiteSpace size='lg'/>
                <WingBlank>
        			<Flex justify="between" className={styles['title']} onClick={() => this.toSelectAddress()}>
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
                            <span className={styles['address']}>地址：{address.address}</span>
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

            <div>
                <WhiteSpace size='lg'/>
                <WingBlank>
                    <Flex justify="between">
                        <span style={{color: '#28BB78'}}>退还金额：{returnMoney}元</span>
                    </Flex>
                </WingBlank>
                <WhiteSpace size='lg'/>
            </div>

        	<div className={styles['button-group']}>
				<Button type="ghost" size="small" className={styles['button']} onClick={() => this.props.history.goBack()}>取消</Button>
        		<Button type="primary" size="small" className={styles['button']} onClick={this.toPay}>确认</Button>
        	</div>
        </div>);
    }
}

export default ChickenEat;
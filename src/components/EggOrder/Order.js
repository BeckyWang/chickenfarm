import React from 'react';
import { WingBlank, WhiteSpace, Icon } from 'antd-mobile';

import Item from './Item';
import router from '../../containers/router';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;

class Order extends React.Component {
    constructor() {
        super();

        this.state = {
            totalPrice: 0,
            keyList: [],
            orderData: {},
        }

        this.toPayOrder = this.toPayOrder.bind(this);
    }

    componentWillMount() {
        const { eggs } = this.props.orderInfo;
        const keyList = [],//订单每部分的key值，形式‘单元/日期（yyyy-MM-dd）’
            renderData = {};
        let totalPrice = 0;

        eggs.forEach(item => {
            const renderKey = `${item.cuid}/${item.createtime.split(' ')[0]}`,
                renderLen = keyList.length;
            let isExsited = false;

            for(let i = 0, len = renderLen; i < len; i++) {
                if(keyList[i] === renderKey) {
                    isExsited = true;
                    renderData[renderKey].push(item);
                    break;
                }
            }

            if(!isExsited) {
                keyList.push(renderKey);
                renderData[renderKey] = [item];
            }

            totalPrice += item.eggsell;         
        });

        this.setState({
            totalPrice: totalPrice.toFixed(2),
            keyList,
            orderData: renderData,
        });
    }

    toPayOrder() {
        const { totalPrice } = this.state;
        const { orderInfo: { orderId } } = this.props;
        this.props.goTo('/weixin/cultivation/pay', {type: 'egg_order', totalPrice, orderId});
    }

    render() {
        const { farmName } = this.props.orderInfo;
        const { keyList, orderData, totalPrice } = this.state;

        const orderComponent = keyList.length && <div style={{height: clientHeight * 4 / 5}}  className={styles['order-info']}>
            {
                keyList.map(item => <Item keyValue={item} info={orderData[item]} />)
            }
        </div>;

        return (
            <div>
                <WingBlank className={styles['second-header']}>
                    <span><Icon type={require('../../asserts/icon/icon_step1.svg')} className={styles['second-header-icon']}/>确认订单</span>
                    <span onClick={this.toPayOrder}>下一步</span>
                </WingBlank>

                <div className={styles['order-title']}><Icon type={require('../../asserts/icon/farm.svg')} className={styles['second-header-icon']}/>品牌：{farmName}</div>

                { orderComponent }
            </div>
        );
    }
}

export default router(Order);
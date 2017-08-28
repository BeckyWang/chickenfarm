import React from 'react';
import { Flex, Button, Modal } from 'antd-mobile';

import router from '../../containers/router';
import styles from './styles';

const alert = Modal.alert;
const clientHeight = document.documentElement.clientHeight;

class Footer extends React.Component {
    constructor() {
        super();

        this.toMyAdopted = this.toMyAdopted.bind(this);
        this.toBuyEgg = this.toBuyEgg.bind(this);
        this.toMyFocused = this.toMyFocused.bind(this);
    }

    toRegister() {
        alert('提示', '此功能只对会员开放，您还不是我们的会员，确定注册为会员？', [
            { text: '不了，谢谢' },
            { text: '去注册', onPress: () => {this.props.goTo('/weixin/cultivation/register')}},
        ])
    }

    toMyAdopted() {
        const { isUser, farmId, farmName } = this.props;
        if(isUser) {
            farmId ? this.props.goTo(`/weixin/cultivation/farms/${farmId}/my-adopted`, {farmName}) : this.props.goTo('/weixin/cultivation/my-adopted');
        } else {
            this.toRegister();
        }
    }

    toBuyEgg() {
        const { isUser, farmId, farmName } = this.props;

        if(isUser) {
            // this.props.goTo('/weixin/cultivation/farms/paytest')
            farmId ? this.props.goTo(`/weixin/cultivation/egg/order/farms/${farmId}`) : this.props.goTo('/weixin/cultivation/egg/order/farms/all');
        } else {
            this.toRegister();
        }
    }

    toMyFocused() {
        const { isUser, farmId, farmName } = this.props;
        if(isUser) {
            farmId ? this.props.goTo(`/weixin/cultivation/farms/${farmId}/my-focused`, {farmName}) : this.props.goTo('/weixin/cultivation/my-focused');
        } else {
            this.toRegister();
        }
    }

    render() {
        return (
            <Flex wrap="wrap" justify="around" align="center" className={styles['footer']} style={{height: clientHeight * 1 / 8}}>
                <Button type="primary" className={styles['button']} onClick={this.toMyAdopted}>我的认养</Button>
                <Button type="primary" className={styles['button']} onClick={this.toBuyEgg}>鸡蛋订购</Button>
                <Button type="primary" className={styles['button']} onClick={this.toMyFocused}>我的关注</Button>
            </Flex>
        );
    }
}

export default router(Footer);
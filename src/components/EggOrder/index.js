import React from 'react';
import { WingBlank, WhiteSpace, Result, Icon, Button } from 'antd-mobile';

import { orderEggInfarm, orderEggInfarms } from '../../unit/fetch';
import Loading from '../public/Loading';
import Order from './Order';

import styles from './styles';

class EggOrder extends React.Component {
    constructor() {
        super();

        this.state = {
            eggOrder: {},
            loading: true,
            error: false,
        }

        this.toChangeStatus = this.toChangeStatus.bind(this);
    }

    componentWillMount() {
        (async () => {
        	const { farmId } = this.props.match.params;
            try {
                const response = farmId ? await orderEggInfarm(farmId) : await orderEggInfarms();

                this.setState({
                    eggOrder: response,
                    loading: false,
                });
            } catch(e) {
                this.setState({
                    loading: false,
                    error: true,
                });
            }
        })();
    }

    toChangeStatus() {
        this.setState({
            eggOrder: {
                ...this.state.eggOrder,
                status: 0,
            }
        });
    }

    render() {
        const { eggOrder, loading, error } = this.state;
        const { status, farmName } = eggOrder;
        let bodyComponent = null;
        let orderComponet = null;

        if(status + 1) {
            switch(status) {
                case 0: 
                    orderComponet = <Order orderInfo={eggOrder} />;
                    break;
                case 1: 
                    orderComponet = <div>
                        <Result
                            img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
                            title="提示"
                            message="因销售火爆，所有鸡蛋已被其他消费者订购。建议您选择自己喜欢的鸡场，并认养母鸡，认养母鸡所产的鸡蛋由您自主支配。"
                        />
                        <WhiteSpace size='lg'/>
                        <Button type="ghost" onClick={() => this.props.history.goBack()}>算了</Button>
                        <WhiteSpace size='lg'/>
                        <Button type="primary" onClick={() => this.props.history.goBack()}>去认养</Button>                        
                        <WhiteSpace size='lg'/>
                    </div>;
                    break;
                default: 
                    orderComponet = <div>
                        <Result
                            img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
                            title="提示"
                            message={`您指定的品牌鸡场鸡蛋已全被其他顾客订购，是否接受系统为您分配${farmName}鸡场的鸡蛋？`}
                        />
                        <WhiteSpace size='lg'/>
                        <Button type="ghost" onClick={() => this.props.history.goBack()}>不接受</Button>
                        <WhiteSpace size='lg'/>
                        <Button type="primary" onClick={this.toChangeStatus}>接受</Button>
                        <WhiteSpace size='lg'/>
                    </div>;;
                    break;
            }
        }

        if(loading){
            bodyComponent = <Loading tips='正在生成订单信息，请稍后...'/>
        } else {
            bodyComponent = error ? <Result
                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                title="获取失败"
                message="网络错误，生成订单信息失败，请稍候再试！"
            /> : orderComponet;
        }

        return (
            <div className={styles['egg-order-container']}>
                <div>
                    <WhiteSpace size='lg'/>
                    <WingBlank className={styles['public-header']}>
                        <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                        <span>鸡蛋订购</span>
                        <span></span>
                    </WingBlank>
                    <WhiteSpace />
                </div>

                { bodyComponent }
            </div>
        );
    }
}

export default EggOrder;
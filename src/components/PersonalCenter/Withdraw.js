import React from 'react';
import { WingBlank, WhiteSpace, Icon, Button, Result, Modal, InputItem, List, Toast } from 'antd-mobile';

import { getUserInfo, updateAlipay } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

const prompt = Modal.prompt;

class Withdraw extends React.Component {
    constructor() {
        super();

        this.state = {
        	alipay: '',
        	withdrawMoney: null,
            loading: true,
            error: false,
        };

        this.toComplete = this.toComplete.bind(this);
        this.onChangeMoney = this.onChangeMoney.bind(this);
        this.toWithdraw = this.toWithdraw.bind(this);
    }

    componentWillMount() {
		(async () => {
            try {
				const { alipay } = await getUserInfo();
				
				this.setState({
                    loading: false,
                    alipay,
                })               
            } catch(e) {
                this.setState({
                    loading: false,
                    error: true,
                })
            }
        })();
    }

    toComplete() {
    	prompt('补全信息', '填写微信账号，用于提现财富。', [
			{ text: '取消' },
			{
				text: '确定',
				onPress: async value => {
                    await updateAlipay({alipay: value});
                    this.setState({
                        alipay: value,
                    });
				},
			},
		], 'default', null, ['请输入您的微信账号'])
    }

    onChangeMoney(val) {
    	this.setState({
    		withdrawMoney: val,
    	});
    }

    toWithdraw() {
    	const { withdrawMoney } = this.state;
        const { wealth } = this.props.location.state;
        
        if(!withdrawMoney || withdrawMoney === '0') {
        	Toast.fail('请输入提现金额', 2);
        	return;
        }

        if(withdrawMoney > wealth) {
        	Toast.fail('提现金额不得大于财富总额', 2);
        	return;
        }

    }

    render() {
    	const { alipay, loading, error, withdrawMoney } = this.state;

    	const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                <span>财富提现</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;

    	if(loading) {
    		return <div className={styles['withdraw-container']}>
                { headerComponent }
                <Loading tips='正在获取账号信息，请稍后...'/>
            </div>;
    	}

        return (
            <div className={styles['withdraw-container']}>
                { headerComponent }
                { error ? <Result
	                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
	                title="获取失败"
	                message="网络错误，获取账户信息失败，请稍候再试！"
	            /> : (alipay ? <div className={styles['withdraw-info']}>
	            	<div>
	            		<span>到微信账号</span>
	            		<span className={styles['account']}>{alipay}</span>
	            	</div>
	            	<div>
	            		<p>提现金额<span className={styles['color-gray']}>（不得大于财富总额）</span></p>
	            		<List>
	            			<List.Item multipleLine>
	            				<InputItem
									type="money"
									placeholder="请输入提现金额"
									labelNumber={2}
									value={withdrawMoney}
									onChange={this.onChangeMoney}
									className={styles['money']}
								>
									<Icon type={require('../../asserts/icon/money2.svg')} />
								</InputItem>
	            			</List.Item>
	            		</List>
	            	</div>
            		<WhiteSpace size='lg'/>
	        		<Button type="primary" onClick={this.toWithdraw}>确定</Button>
	            </div> : <div>
	            	<Result
		                img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
		                title="提示"
		                message="您的提现账户信息还未填写完整，请先补全账户信息。"
		            />
            		<WhiteSpace size='lg'/>
                    <Button type="primary" onClick={this.toComplete}>补全信息</Button>
            		<WhiteSpace size='lg'/>
                    <Button type="ghost" onClick={() => this.props.history.goBack()}>取消</Button>
	            </div>) }
            </div>
        );
    }
}

export default Withdraw;
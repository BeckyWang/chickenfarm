import React from 'react';
import { Link } from 'react-router-dom';
import { WingBlank, WhiteSpace, Icon, Button, Result, Flex } from 'antd-mobile';

import { getMyClients } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;

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
	                message="您还没有客户，可通过分享页面给朋友开发新客户！"
	            />}
            </div>
        );
    }
}

export default Client;
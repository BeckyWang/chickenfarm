import React from 'react';
import { WingBlank, WhiteSpace, Icon, Button, Result } from 'antd-mobile';

import { getMyTreasure } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

class Treasure extends React.Component {
    constructor() {
        super();

        this.state = {
        	treasureInfo: {},
            loading: true,
            error: false,
        };
    }

    componentWillMount() {
		(async () => {
            try {
                this.setState({
                    treasureInfo: await getMyTreasure(),
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
    	const { treasureInfo, loading, error } = this.state;
    	const { deposit, wealth } = treasureInfo;

    	const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                <span>我的财富</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;

    	if(loading) {
    		return <div className={styles['personal-center-container']}>
                { headerComponent }
                <Loading tips='正在获取我的财富信息，请稍后...'/>
            </div>;
    	}

        return (
            <div className={styles['wealth-container']}>
                { headerComponent }
                { error ? <Result
	                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
	                title="获取失败"
	                message="网络错误，获取我的财富信息失败，请稍候再试！"
	            /> : <div>
	            	<WingBlank className={styles['wealth-info']}>
	            		<p>押金总额：<span className={styles['deposit']}>{deposit}元（已冻结）</span></p>
	    				<p>财富总额：{wealth}元</p>
	            	</WingBlank>
	            	<WhiteSpace size='lg'/>
	        		<Button type="primary" onClick={() => this.props.history.push('/weixin/cultivation/person_center/withdraw', {wealth})}>提现</Button>
	            	<WhiteSpace size='lg'/>
					<Button type="ghost" onClick={() => this.props.history.goBack()}>我知道了</Button>		        	
	    		</div> }
            </div>
        );
    }
}

export default Treasure;
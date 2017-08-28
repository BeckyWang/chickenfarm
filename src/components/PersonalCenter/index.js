import React from 'react';
import { Link } from 'react-router-dom';
import { WingBlank, WhiteSpace, Icon, Button, Result, Grid } from 'antd-mobile';

import { getUserInfo } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

class PersonalCenter extends React.Component {
    constructor() {
        super();

        this.state = {
            isUser: true,
        	personalInfo: {},
            loading: true,
            error: false,
        };

        this.gridData = [{
        	icon: require('../../asserts/icon/money.svg'),
        	text: '我的财富',
        	link: '/weixin/cultivation/person_center/treasure',
        }, {
        	icon: require('../../asserts/icon/users.svg'),
        	text: '我的客户',
        	link: '/weixin/cultivation/person_center/client',
        }, {
        	icon: require('../../asserts/icon/address.svg'),
        	text: '我的地址',
        	link: '/weixin/cultivation/address/manage',
        }];

        this.getUserInfo = this.getUserInfo.bind(this);
    }

    async getUserInfo(openId) {
        try {
            this.setState({
                personalInfo: await getUserInfo(openId),
                loading: false,
            })
        } catch(e) {
            this.setState({
                loading: false,
                error: true,
            })
        }
    }

    componentWillMount() {
    	if(this.props.isUser && this.props.openId) {
    		this.getUserInfo();
    	}
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.isUser !== this.props.isUser) {
            nextProps.isUser ? this.getUserInfo(nextProps.openId) : this.setState({
                loading: false,
                isUser: false,
            });        
        }
    }

    render() {
    	const { personalInfo, loading, error, isUser } = this.state;
    	const { realname } = personalInfo;

    	const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <sapn></sapn>
                <span>个人中心</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;

        if(loading) {
            return <div className={styles['personal-center-container']}>
                { headerComponent }
                <Loading tips='正在获取个人信息，请稍后...'/>
            </div>;
        }

        if(!isUser) {
    		return <div className={styles['personal-center-container']}>
                { headerComponent }
                <div>
                	<Result
		                img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
		                title="提示"
		                message="您还不是我们的会员，现在去注册会员？"
		            />
            		<WhiteSpace size='lg'/>
	        		<Button type="primary" onClick={() => {this.props.history.push('/weixin/cultivation/register')}}>去注册</Button>
                </div>
            </div>;
    	}

        return (
            <div className={styles['personal-center-container']}>
                { headerComponent }
                { error ? <Result
	                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
	                title="获取失败"
	                message="网络错误，获取个人信息失败，请稍候再试！"
	            /> : <div>
	    			<div className={styles['welcome-tip']}>
	    				{realname}，欢迎您！
	    			</div>
	    			<Grid 
	    				data={this.gridData} 
	    				columnNum={3} 
	    				renderItem={({icon, link, text}) => (
							<Link to={link} className={styles['item']}>
								<Icon type={icon} style={{ width: '0.9rem', height: '0.9rem' }} />
								<div className={styles['item-title']}>
									<span>{text}</span>
								</div>
							</Link>
						)}
	    			/>
	    		</div> }
            </div>
        );
    }
}

export default PersonalCenter;
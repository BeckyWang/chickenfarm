import React from 'react';
import { Link } from 'react-router-dom';
import { WingBlank, WhiteSpace, Result, Icon, Button } from 'antd-mobile';

import router from '../../containers/router';
import { getAddressList } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

class AddressList extends React.Component {
    constructor() {
        super();

        this.state = { 
        	addressList: [],
            loading: true,
            error: false,
        }

        this.onSelected = this.onSelected.bind(this);
    }

    componentWillMount() {
        (async () => {
            try {
                this.setState({
                    addressList: await getAddressList(),
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

    onSelected(id) {
        this.props.updateAddress(this.state.addressList.filter(item => item.raid === id)[0]);
        this.props.history.goBack();
    }

    render() {
        const { addressList, loading, error } = this.state;
        let bodyComponent = null;
        
        if(loading){
            bodyComponent = <Loading tips='正在获取地址列表，请稍后...'/>;
        } else {
            if(error) {
                bodyComponent = <Result
                    img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                    title="获取失败"
                    message="网络错误，获取地址列表失败，请稍候再试！"
                />;
            } else {
                bodyComponent = addressList.length ? <div className={styles['list-body']}>
                    { addressList.map(({raid, consignee, phone, address}) => <div className={styles['address-item']} onClick={() => this.onSelected(raid)}>
                        <div className={styles['info']}>
                            <span>{consignee}</span>
                            <span>{phone}</span>
                        </div>
                        <div className={styles['address']}>{address}</div>
                    </div>) }
                </div> : <p className={styles['no-address']}>
                   您还没有添加任何地址！ 
                </p>;
            }
        }

        return (
            <div className={styles['address-container']}>
                <div>
                    <WhiteSpace size='lg'/>
                    <WingBlank className={styles['public-header']}>
                        <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                        <span>选择收货地址</span>
                        <Link to='/weixin/cultivation/address/manage' className={styles['extra-operation']}>管理</Link>
                    </WingBlank>
                    <WhiteSpace size='lg'/>
                </div>

                { bodyComponent }
            </div>
        );
    }
}

export default router(AddressList);
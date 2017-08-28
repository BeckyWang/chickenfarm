import React from 'react';
import { WingBlank, WhiteSpace, Result, Icon, Button, Toast, Modal} from 'antd-mobile';

import router from '../../containers/router';
import { getAddressList, deleteAddress } from '../../unit/fetch';
import Loading from '../public/Loading';
import Item from './Item';

import styles from './styles';

const alert = Modal.alert;

const clientHeight = document.documentElement.clientHeight;

class AddressManage extends React.Component {
    constructor() {
        super();

        this.state = { 
        	addressList: [],
            loading: true,
            error: false,
        }

        this.toAddNewAddress = this.toAddNewAddress.bind(this);
        this.toDeleteAdrr = this.toDeleteAdrr.bind(this);
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

    toAddNewAddress() {
        this.props.goTo('/weixin/cultivation/address/add');
    }

    toDeleteAdrr(id) {
        alert('提示', '确定删除地址？', [
            { text: '取消' },
            { text: '确定', onPress: async () => {
                try {
                    await deleteAddress(id);

                    this.setState({
                        addressList: this.state.addressList.filter(item => item.raid !== id),
                    });

                    if(this.props.address.raid === id) {
                    	this.props.updateAddress({});
                    }
                } catch({info = '删除失败，请稍候再试！'}) {
                    Toast.fail(info, 1);
                }
            } },
        ])
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
                bodyComponent = addressList.length ? <div style={{height: clientHeight * 3 / 4}} >
                    { addressList.map(item => <Item info={item} toDelete={this.toDeleteAdrr} />) }
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
                        <span onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></span>
                        <span>管理收货地址</span>
                        <span></span>
                    </WingBlank>
                    <WhiteSpace size='lg'/>
                </div>

                <div className={styles['list-body']}>
                    { bodyComponent }
                </div>

                <Button type="primary" className={styles['add-button']} onClick={this.toAddNewAddress}>添加新地址</Button>
                <WhiteSpace size='lg'/>
            </div>
        );
    }
}

export default router(AddressManage);
import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { WingBlank, WhiteSpace, Flex, Result, Icon, Popup, List, Modal, Toast } from 'antd-mobile';

import { getAllMyFocused, getMyFocused, focusChicken } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

const alert = Modal.alert;
let cx = classNames.bind(styles);
const clientHeight = document.documentElement.clientHeight;
let dataStorage = [];
const CHICKEN_STATE = {
    0: '饲养中，鸡蛋可售',
    1: '饲养中，鸡蛋自留',
    2: '预售',
    3: '已售',
    4: '已处理',
};

const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);
let maskProps;
if (isIPhone) {
  // Note: the popup content will not scroll.
  maskProps = {
    onTouchStart: e => e.preventDefault(),
  };
};

class MyFocused extends React.Component {
    constructor() {
        super();

        this.state = {
            dataSource: [],
            loading: true,
            error: false,
        };

        this.moreOperation = this.moreOperation.bind(this);
    }

    componentWillMount() {
        const { farmId } = this.props.match.params;
        (async () => {
            try {
                if(farmId) {
                    dataStorage = await getMyFocused(farmId);
                } else {
                    dataStorage = await getAllMyFocused();
                }
                this.setState({
                    dataSource: dataStorage,
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

    toAdopt(cid, state, isAdopted) {
        if(state !== 0 || isAdopted) {
            return;
        }

        this.props.history.push('/weixin/cultivation/pay', {chickenId: cid, type: 'chicken_adopt'});
        Popup.hide();
    }

    toBuyChicken(cid, state) {
        if(state !== 2) {
            return;
        }

        this.props.history.push('/weixin/cultivation/pay', {chickenId: cid, type: 'chicken_order'});
        Popup.hide();
    }

    toCancelFocus(cid, cname) {
        alert('提示', `确定取消对鸡只${cname}的关注？`, [
            { text: '继续关注' },
            { text: '取消关注', onPress: async () => {
                try {
                    await focusChicken(cid);
                    Toast.success('取消关注成功！', 2);

                    this.setState({
                        dataSource: this.state.dataSource.cloneWithRows(dataStorage.filter(item => item.id !== cid)),
                    });
                } catch({info='未知错误，请稍后再试！'}) {
                    Toast.fail(info, 1);
                }
                Popup.hide();
            } },
        ]);
    }

    renderPopupTitle(cname) {
        return <Flex justify="between" className={styles['popup-title']}>
            <span>确定对编号为{cname}的鸡只进行以下操作？</span>
            <Icon 
                className={styles['width-40']}
                type="cross" 
                onClick={() => Popup.hide()}
            />
        </Flex>;
    }

    moreOperation(cid, cname, state, isAdopted) {
        Popup.show(<List renderHeader={() => this.renderPopupTitle(cname)} >
            <List.Item
                onClick={() => this.toCancelFocus(cid, cname)}
            >不再关注</List.Item>
            <List.Item
                className={cx({'background-gray': state !== 2})}
                onClick={() => this.toBuyChicken(cid, state)}
            >{state === 2 ? '吃掉它' : '不是预售期不可购买'}</List.Item>
            <List.Item
                className={cx({'background-gray': state !== 0 || isAdopted})}
                onClick={() => this.toAdopt(cid, state, isAdopted)}
            >{state === 0 && !isAdopted ? '认养它' : '不能认养'}</List.Item>
        </List>, { animationType: 'slide-up', maskProps, maskClosable: false });
    }

    render() {
        const { state } = this.props.location;
        const { dataSource, loading, error } = this.state;
        const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                <span>我的关注</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
            <WingBlank>
                <Icon type={require('../../asserts/icon/farm.svg')} className={styles['second-header-icon']}/>
                <span className={styles['second-header']}>鸡场品牌：{(state && state.farmName) || '所有鸡场'}</span>
            </WingBlank>
            <WhiteSpace />
        </div>;

        if(loading){
            return <div className={styles['my-focused-container']}>
                { headerComponent }
                <Loading tips='正在获取关注信息，请稍后...'/>
            </div>;
        }

        if(error) {
            return <div className={styles['my-focused-container']}>
                { headerComponent }
                <Result
                    img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                    title="获取失败"
                    message="网络错误，获取关注信息失败，请稍候再试！"
                />
            </div>;
        }

        return (
            <div className={styles['my-focused-container']}>
                { headerComponent }
                { dataSource.length ? <div>
                    <Flex className={styles['table-header']}>
                        <span style={{width: '30%'}}>关注鸡只</span>
                        <span style={{width: '20%'}}>日龄</span>
                        <span style={{width: '50%'}}>当前状态</span>
                    </Flex>
                    <div className={styles['table-body']} style={{height: clientHeight * 2 / 3}}>
                        {
                            dataSource.map(({name, id, age, state, price, isAdopted}) => <Flex className={styles['chicken-item']}>
                                <span style={{width: '30%'}} className={styles['more']}>
                                    <Link to={{pathname:`/weixin/cultivation/chicken/production/${id}`, state: {chickenName: name}}} style={{width: '70%'}} >{name}</Link>
                                    <Icon type="down" size="xs" className={styles['more-icon']} onClick={() => this.moreOperation(id, name, state, isAdopted)}/>
                                </span>
                                <span style={{width: '20%'}}>{age}天</span>
                                <span style={{width: '50%'}}>
                                    { CHICKEN_STATE[state] }
                                    { state === 2 &&  `（${price}元）`}
                                </span>
                            </Flex>)
                        }
                    </div>
                </div> : <Result
                    img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
                    title="提示"
                    message="您还没有关注任何鸡只"
                /> }
            </div>
        );
    }
}

export default MyFocused;
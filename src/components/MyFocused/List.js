import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { WingBlank, WhiteSpace, Flex, Result, Icon, ListView, Popup, List, Modal, Toast } from 'antd-mobile';

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

        const dataSource = new ListView.DataSource({
            rowHasChanged: (row1, row2) => row1 !== row2,
        });

        this.state = {
            dataSource: dataSource.cloneWithRows([]),
            loading: true,
            error: false,
        };

        this.moreOperation = this.moreOperation.bind(this);
        this.renderRow = this.renderRow.bind(this);
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
                    dataSource: this.state.dataSource.cloneWithRows(dataStorage),
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

    toAdopt(cid, isAdopted) {
        if(isAdopted) {
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
                className={cx({'background-gray': isAdopted})}
                onClick={() => this.toAdopt(cid, isAdopted)}
            >{isAdopted ? '已被认养' : '认养它'}</List.Item>
        </List>, { animationType: 'slide-up', maskProps, maskClosable: false });
    }

    renderRow(rowData, sectionID, rowID) {
        const { name, id, age, state, price, isAdopted } = rowData;

        return(
            <Flex key={rowID} className={styles['chicken-item']}>
                <span style={{width: '30%'}} className={styles['more']}>
                    <Link to={{pathname:`/weixin/cultivation/chicken/production/${id}`, state: {chickenName: name}}} style={{width: '70%'}} >{name}</Link>
                    <Icon type="down" size="xs" className={styles['more-icon']} onClick={() => this.moreOperation(id, name, state, isAdopted)}/>
                </span>
                <span style={{width: '20%'}}>{age}天</span>
                <span style={{width: '50%'}}>
                    { CHICKEN_STATE[state] }
                    { state === 2 &&  `（${price}元）`}
                </span>
            </Flex>
        )
    };

    render() {
        const { state } = this.props.location;
        const { dataSource, loading, error } = this.state;
        let bodyComponent = null;

        if(loading){
            bodyComponent = <Loading tips='正在获取关注信息，请稍后...'/>
        } else {
            bodyComponent = error ? <Result
                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                title="获取失败"
                message="网络错误，获取关注信息失败，请稍候再试！"
            /> : (dataSource._cachedRowCount ? <div>
                <Flex className={styles['table-header']}>
                    <span style={{width: '30%'}}>关注鸡只</span>
                    <span style={{width: '20%'}}>日龄</span>
                    <span style={{width: '50%'}}>当前状态</span>
                </Flex>
                <ListView 
                    dataSource={dataSource}
                    renderRow={this.renderRow}
                    pageSize={8}
                    style={{height: clientHeight * 4 / 5}}
                />
            </div> : <Result
                img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
                title="提示"
                message="您还没有关注任何鸡只"
            />)
        }
        return (
            <div className={styles['my-focused-container']}>
                <div>
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
                </div>

                { bodyComponent }
            </div>
        );
    }
}

export default MyFocused;
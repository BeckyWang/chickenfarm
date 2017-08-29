import React from 'react';
import classNames from 'classnames/bind';
import { WingBlank, WhiteSpace, Flex, Result, Icon, ListView, Popup, List, Toast, Modal } from 'antd-mobile';

import { getMyAdopted, getAllMyAdopted, keepEgg } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

const alert = Modal.alert;
let cx = classNames.bind(styles);
const clientHeight = document.documentElement.clientHeight;
let dataStorage = [];

const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);
let maskProps;
if (isIPhone) {
  // Note: the popup content will not scroll.
  maskProps = {
    onTouchStart: e => e.preventDefault(),
  };
}

class MyAopted extends React.Component {
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
        this.toKeepEgg = this.toKeepEgg.bind(this);
        this.toBuyChicken = this.toBuyChicken.bind(this);
        this.toProduction = this.toProduction.bind(this);
    }

    componentWillMount() {
        const { farmId } = this.props.match.params;
        (async () => {
            try {
                if(farmId) {
                    dataStorage = await getMyAdopted(farmId);
                } else {
                    dataStorage = await getAllMyAdopted();
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

    toExtendAdoptTime(cid) {
        this.props.history.push('/weixin/cultivation/pay/chicken_delay', {chickenId: cid});
        Popup.hide();
    }

    toBuyChicken(cid, adoptDays, restDays) {
        if(adoptDays < 30) {
            return;
        }

        alert('提示', '购买您认养的鸡只所需要的花费将从您的认养押金里扣除，若认养鸡只未到期，剩下的日花销将退还到您的财富里，确定购买？', [
            { text: '取消' },
            { text: '确定', onPress: () => {this.props.history.push('/weixin/cultivation/pay/chicken_eat', {chickenId: cid, restDays})}},
        ])

        Popup.hide();
    }

    toKeepEgg(cid, state) {
        const tips = state ? '取消自留成功！' : '鸡蛋自留成功！';
        (async () => {
            try {
                await keepEgg(cid);
                Toast.success(tips, 2);
                dataStorage.map(item => {
                    if(item.cid === cid) {
                        return item.state = item.state ? 0 : 1;
                    }
                });
                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(JSON.parse(JSON.stringify(dataStorage))),
                });
            } catch({info='未知错误，请稍后再试！'}) {
                Toast.fail(info, 1);
            }
            Popup.hide();
        })();
    }

    toProduction(cid, cname) {
        this.props.history.push(`/weixin/cultivation/chicken/production/${cid}`, {chickenName:cname});
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

    moreOperation(rowData) {
        const { cname, cid, restDays, age, eggnum, state, adoptDays } = rowData;

        Popup.show(<List renderHeader={() => this.renderPopupTitle(cname)} >
            <List.Item
                onClick={() => this.toKeepEgg(cid, state)}
            >{state ? '取消自留' : '鸡蛋自留'}</List.Item>
            <List.Item
                className={cx({'background-gray': adoptDays < 30})}
                onClick={() => this.toBuyChicken(cid, adoptDays, restDays)}
            >{adoptDays > 29 ? '吃掉它' : '认养未超过30天，不可购买'}</List.Item>
            <List.Item
                onClick={() => this.toExtendAdoptTime(cid)}
            >认养延期</List.Item>
        </List>, { animationType: 'slide-up', maskProps, maskClosable: false });
    }

    renderRow(rowData, sectionID, rowID) {
        const { cname, cid, restDays, age, eggnum, state, adoptDays } = rowData;
        
        return(
            <Flex key={rowID} className={styles['chicken-item']}>
                <span style={{width: '30%'}} onClick={() => this.toProduction(cid, cname)}>{cname}</span>
                <span style={{width: '25%'}}>{ eggnum ? <Icon type="check" /> : ''}</span>
                <span style={{width: '20%'}}>{age}天</span>
                {  state === 4 ? <span style={{width: '25%', color: '#d22'}} >
                    死亡
                </span> : <span style={{width: '25%'}} className={styles['more']}>
                    {restDays}天
                    <Icon type="down" size="xs" className={styles['more-icon']} onClick={() => this.moreOperation(rowData)}/>
                </span> }
            </Flex>
        )
    };

    render() {
        const { state } = this.props.location;
        const { dataSource, loading, error } = this.state;
        let bodyComponent = null;
        
        if(loading){
            bodyComponent = <Loading tips='正在获取认养信息，请稍后...'/>
        } else {
            bodyComponent = error ? <Result
                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                title="获取失败"
                message="网络错误，获取认养信息失败，请稍候再试！"
            /> : (dataSource._cachedRowCount ? <div>
                <Flex className={styles['table-header']}>
                    <span style={{width: '30%'}}>认养鸡只</span>
                    <span style={{width: '25%'}}>今日产蛋</span>
                    <span style={{width: '20%'}}>日龄</span>
                    <span style={{width: '25%'}}>剩余天数</span>
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
                message="您还没有认养任何鸡只"
            />)
        }
        return (
            <div className={styles['my-adopted-container']}>
                <div>
                    <WhiteSpace size='lg'/>
                    <WingBlank className={styles['public-header']}>
                        <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                        <span>我的认养</span>
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

export default MyAopted;
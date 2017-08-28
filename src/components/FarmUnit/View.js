import React from 'react';
import classNames from 'classnames/bind';
import moment from 'moment';
import { WingBlank, WhiteSpace, Flex, Result, Icon, ListView, Popup, List, Modal, Toast, DatePicker, Button } from 'antd-mobile';

import { getChickenList, getMyFocusAndAdopted, focusChicken, getEggList } from '../../unit/fetch';
import Loading from '../public/Loading';
import { renderMobile } from '../../unit/tool';

import styles from './styles';

let cx = classNames.bind(styles);
const alert = Modal.alert;

const clientHeight = document.documentElement.clientHeight;
const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);
let maskProps;
if (isIPhone) {
  // Note: the popup content will not scroll.
  maskProps = {
    onTouchStart: e => e.preventDefault(),
  };
}

const CHICKEN_STATE = {
    0: '饲养中，鸡蛋可售',
    1: '饲养中，鸡蛋自留',
    2: '预售',
    3: '已售',
    4: '已处理',
};

class UnitView extends React.Component {
	constructor(props) {
        super(props);

		const dataSource = new ListView.DataSource({
			rowHasChanged: (row1, row2) => row1 !== row2,
		});
    
        this.state = {
        	dataSource: dataSource.cloneWithRows([]),
            loading: true,
            error: false,
            searchDate: moment(),
        };

        this.toSeacher = this.toSeacher.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.toRegister = this.toRegister.bind(this);
        this.moreOperation = this.moreOperation.bind(this);
        this.renderRow = this.renderRow.bind(this);
    }

    componentWillMount() {
        (async () => {
            try {
                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(await getChickenList(this.props.match.params.unitId)),
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

    toRegister() {
        alert('提示', '此操作只对会员开放，您还不是我们的会员，确定注册为会员？', [
            { text: '不了，谢谢' },
            { text: '去注册', onPress: () => {
                this.props.history.push('/weixin/cultivation/register');
                Popup.hide();
            } },
        ])
    }

    toSeacher() {
        const { farmName, unitName } = this.props.location.state;
        const { searchDate } = this.state;

        const year = searchDate._d.getFullYear();
        const month = searchDate._d.getMonth();
        const date = searchDate._d.getDate();
        const time = `${year}-${(month + 1 + '').padStart(2, '0')}-${(date + '').padStart(2, '0')}`;

        this.props.history.push(`${this.props.match.url}/eggs/${time}`, {
            farmName,
            unitName,
        });
    }

    handleFocus(myFocused, cid) {
        const tips = myFocused ? '取消关注成功！' : '成功关注，可在我的关注里查看！';
        (async () => {
            try {
                await focusChicken(cid);
                Toast.success(tips, 2);
            } catch({info='未知错误，请稍后再试！'}) {
                Toast.fail(info, 1);
            }
            Popup.hide();
        })();
    }

    //参数：是否被认养， 鸡只Id
    toAdopt({isAdopted, cid, state}) {
        if(isAdopted || state > 1) {
            return;
        }
        
        if(this.props.isUser) {
            Popup.hide();
            this.props.history.push('/weixin/cultivation/pay/chicken_adopt', {chickenId: cid});
        } else {
            this.toRegister();
        }
    }

    //参数：我是否已关注， 鸡只Id
    toFocus(myFocused, cid) {
        if(myFocused) {
            alert('提示', `确定取消对鸡只的关注？`, [
                { text: '继续关注' },
                { text: '取消关注', onPress: () => this.handleFocus(myFocused, cid) },
            ])
            return;
        }

        if(this.props.isUser) {
            alert('提示', `确定对鸡只进行关注？`, [
                { text: '我再看看' },
                { text: '确定关注', onPress: () => this.handleFocus(myFocused, cid) },
            ])
            return;
        } else {
            this.toRegister();
        }
    }

    toBuy(state, cid, price) {
        if(state !== 2) {
            return;
        }

        if(this.props.isUser) {
            Popup.hide();
            this.props.history.push('/weixin/cultivation/pay/chicken_order', {chickenId: cid});
        } else {
            this.toRegister();
        }
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

    moreOperation(chickenInfo) {
        const { cname, cid, state, isAdopted, dailyspending, deposit, price } = chickenInfo;
        let buyState = '',
            adoptState = '';

        switch(state) {
            case 0: case 1:
                buyState = '不是预售期不可购买';
                adoptState = '认养';
                break;
            case 2: 
                buyState = '购买';
                adoptState = '预售期不可认养';
                break;
            case 3: 
                buyState = '已售';
                adoptState = '已售不可认养';
                break;
            case 4: 
                buyState = '已处理不可购买';
                adoptState = '已处理不可认养';
                break;
        }

        if(this.props.isUser) {
            (async () => {
                try {
                    const { focused, adopted } = await getMyFocusAndAdopted(cid);

                    Popup.show(<List renderHeader={() => this.renderPopupTitle(cname)} >
                        <List.Item
                            className={cx({'background-gray': isAdopted || adopted || state > 1})}
                            onClick={() => this.toAdopt(chickenInfo)}
                        >{isAdopted ? (adopted ? '您已认养' : '已被认养') : adoptState}</List.Item>
                        <List.Item
                            onClick={() => this.toFocus(focused, cid)}
                        >{focused ? '您已关注' : '关注'}</List.Item>
                        <List.Item
                            className={cx({'background-gray': state !== 2})}
                            onClick={() => this.toBuy(state, cid, price)}
                        >{buyState}</List.Item>
                    </List>, { animationType: 'slide-up', maskProps, maskClosable: false });
                } catch({info='未知错误，请稍后再试！'}) {
                    Toast.fail(info, 1);
                }
            })();
        } else {
            Popup.show(<List renderHeader={() => this.renderPopupTitle(cid)} >
                <List.Item
                    className={cx({'background-gray': isAdopted})}
                    onClick={() => this.toAdopt(chickenInfo)}
                >{isAdopted ? '已被认养' : adoptState}</List.Item>
                <List.Item
                    onClick={() => this.toFocus(false, cid)}
                >关注</List.Item>
                <List.Item
                    className={cx({'background-gray': state !== 2})}
                    onClick={() => this.toBuy(state, cid, price)}
                >{buyState}</List.Item>
            </List>, { animationType: 'slide-up', maskProps, maskClosable: false });
        }
    };

    renderRow(rowData, sectionID, rowID) {
		const { cname, age, breed, cid, dailyspending, deposit, sex, state, isAdopted, price, mobile } = rowData;

        return(
            <div key={rowID} className={styles['chicken-item']}>
            	<div className={styles['title']}>
                    <Flex justify="between">
                        <span>编号：{cname}（{sex}鸡）</span>
                        <Icon type="ellipsis" onClick={() => this.moreOperation(rowData)} className={styles['width-40']}/>
                    </Flex>
                </div>
                <Flex justify="around" className={styles['info']}>
                    <Flex.Item>品种：{breed}</Flex.Item>
                    <Flex.Item>日龄：{age}天</Flex.Item>
                </Flex>
                <Flex justify="around">
                    <Flex.Item>日花销：{dailyspending}元</Flex.Item>
                    <Flex.Item>认养押金：{deposit}元</Flex.Item>
                </Flex>
                <Flex justify="around">
                    <Flex.Item>
                        状态：
                        <span className={cx({'color-highlight': state === 2})}>
                        { CHICKEN_STATE[state] }
                        {state === 2 && `（${price}元）`}
                        </span>
                        {state === 3 && `（${renderMobile(mobile)}）`}
                    </Flex.Item>
                </Flex>
            </div>
        )
    };

    render() {
        const { farmName, unitName } = this.props.location.state;
        const { dataSource, loading, error, searchDate } = this.state;
    	let bodyComponent = null;
        
        if(loading){
            bodyComponent = <Loading tips='正在获取鸡只信息，请稍后...'/>
        } else {
            bodyComponent = error ? <Result
                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                title="获取失败"
                message="网络错误，获取鸡只信息失败，请稍候再试！"
            /> : (dataSource._cachedRowCount ? <div>
                <ListView 
                    dataSource={dataSource}
                    renderRow={this.renderRow}
                    pageSize={8}
                    style={{height: clientHeight * 3 / 4}}
                />
                <div className={styles['egg-search']}>
                    <WingBlank>
                        <Flex justify="between" className={styles['title']}>
                            <span><Icon type="search" size="xs" className={styles['title-icon']}/>查看{farmName}{unitName}单元的日生产信息</span>
                            
                        </Flex>
                    </WingBlank>
                    <Flex justify="between" style={{backgroundColor: '#e7e7e7'}}>
                        <div className={styles['date-picker']}>
                            <DatePicker
                                mode="date"
                                title="选择日期"
                                value={searchDate}
                                onChange={v => this.setState({ searchDate: v })}
                            >
                                <List.Item arrow="horizontal" className={styles['picker-body']}>选择日期</List.Item>
                            </DatePicker>
                        </div>
                        <span onClick={this.toSeacher} className={styles['search-button']}>查询</span>
                    </Flex>
                </div>
            </div> : <Result
                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                title="提示"
                message="暂无鸡只信息"
            />)
        }

        return (<div className={styles['unit-view']}>
        	<div>
        		<WhiteSpace size='lg'/>
        		<WingBlank className={styles['public-header']}>
                    <span onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left"/></span>
	            	<span>品牌：{farmName}</span>
	            	<span>单元：{unitName}</span>
	            </WingBlank>
	            <WhiteSpace size='lg'/>
        	</div>
            { bodyComponent }
        </div>);
    }
}

export default UnitView;
import React from 'react';
import { WingBlank, WhiteSpace, Flex, Result, Icon } from 'antd-mobile';

import { getEggList } from '../../unit/fetch';
import Loading from '../public/Loading';
import { renderMobile } from '../../unit/tool';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;

class EggList extends React.Component {
    constructor() {
        super();

        this.state = {
            dataSource: [],
        	loading: true,
        	error: false,
        };

        this.playVideo = this.playVideo.bind(this);
    }

    componentWillMount() {
        (async () => {
            try {
            	const { unitId, date } = this.props.match.params;
                this.setState({
                    dataSource: await getEggList(unitId, {date}),
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

    playVideo() {
        const date  = this.props.match.params.date.split('-').join('');
        const { unitName } = this.props.location.state;
        
        this.props.history.push(`/weixin/cultivation/unit/${unitName}/video/${date}`);
    }

    render() {
        const { farmName, unitName } = this.props.location.state;
        const { date } = this.props.match.params
        const { dataSource, loading, error } = this.state;

        const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <span onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left"/></span>
                <span>品牌：{farmName}</span>
                <span>鸡场单元：{unitName}</span>
            </WingBlank>
            <WhiteSpace />
            <WingBlank className={styles['second-header']}>
                <span>日期：{date}</span>
                <span onClick={this.playVideo}>
                    <Icon type={require('../../asserts/icon/video.svg')} className={styles['second-header-icon']}/>
                    当日视频
                </span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;
        let bodyComponent = null;

        if(loading){
            return <div className={styles['egg-list']}>
                { headerComponent }
                <Loading tips='正在获取日产信息，请稍后...'/>
            </div>;
        } 

        if(error) {
            return <div className={styles['egg-list']}>
                { headerComponent }
                <Result
                    img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                    title="获取失败"
                    message="网络错误，获取日产信息失败，请稍候再试！"
                />
            </div>;
        } 

        bodyComponent = dataSource.length ? <div>
            <Flex className={styles['table-header']}>
                <span style={{width: '12%'}}>蛋号</span>
                <span style={{width: '24%'}}>时间</span>
                <span style={{width: '12%'}}>笼号</span>
                <span style={{width: '15%'}}>状态</span>
                <span style={{width: '12%'}}>售价</span>
                <span style={{width: '25%'}}>购买者</span>
            </Flex>
            <div className={styles['table-body']} style={{height: clientHeight * 2 / 3}}>
            {
                dataSource.map(({eid, caid, state, eggsell, buyer, createtime}) => <Flex className={styles['egg-item']}>
                    <span style={{width: '12%'}}>{eid}</span>
                    <span style={{width: '24%'}}>{createtime.split(' ')[1]}</span>
                    <span style={{width: '12%'}}>{caid}</span>
                    <span style={{width: '15%'}}>{state}</span>
                    <span style={{width: '12%'}}>{eggsell}</span>
                    <span style={{width: '25%'}}>{buyer ? renderMobile(buyer) : ''}</span>
                </Flex>)
            }
        </div>
        </div>: <Result
            img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
            title="提示"
            message="该日期暂无产蛋信息"
        />;

        return (
            <div className={styles['egg-list']}>
                { headerComponent }

                { bodyComponent }

                <div className={styles['footer-tip']}>
                    <WhiteSpace />
                    <WingBlank>
                        根据蛋号包含的时间和所在笼号，可在当日视频中追踪该蛋的母亲。
                    </WingBlank>
                    <WhiteSpace />
                </div>
            </div>
        );
    }
}

export default EggList;
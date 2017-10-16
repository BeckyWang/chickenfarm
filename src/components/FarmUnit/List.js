import React from 'react';
import { WingBlank, WhiteSpace, SearchBar, Flex, Result, Icon } from 'antd-mobile';

import Item from './Item';
import Loading from '../public/Loading';
import { Footer_Cont } from '../../containers/collection';

import { getFarmUnits, queryChickenFarmVideo } from '../../unit/fetch';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;
const clientWidth = document.documentElement.clientWidth;
let dataStorage = [];

class FarmUnit extends React.Component {
	constructor() {
        super();

         this.state = {
            searchValue: '',
            unitList: [],
            loading: true,
            error: false,
            isExisted: true,
        };

        this.onChange = this.onChange.bind(this);
        this.onClear = this.onClear.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onChange(value) {
        this.setState({ searchValue: value, });
    };

    onClear() {
        this.setState({ searchValue: '' });
    }

    onCancel() {
        this.setState({ searchValue: '' });
    }

    onSubmit() {
        const { searchValue, unitList } = this.state;
        let result = [];

        if(searchValue === '') {
            this.setState({
                unitList: dataStorage,
            })
            return;
        }

        for (let val of unitList) {
            if(val.cname.search(searchValue) > -1){
                result.push(val);
            }
        }

        this.setState({
            unitList: result,
        })
    }

    componentWillMount() {
        (async () => {
            try {
                const { farmId } = this.props.match.params;

                const { status } = await queryChickenFarmVideo(farmId);
                const response = await getFarmUnits(farmId);

                dataStorage = response;
                this.setState({
                    unitList: response,
                    loading: false,
                    isExisted: status,
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
        const farmName = this.props.location.state.name;
        const { farmId } = this.props.match.params;
        const { unitList, loading, error, isExisted } = this.state;
        const headerComponent = <div>
            <SearchBar
                value={this.state.searchValue}
                placeholder="输入单元名称"
                onSubmit={this.onSubmit}
                onClear={this.onClear}
                onCancel={this.onCancel}
                onChange={this.onChange}
            />
            <WhiteSpace />
            <WingBlank className={styles['public-header']}>
                <span onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></span>
                <span>品牌：{farmName}</span>
                <span></span>
            </WingBlank>
            <WhiteSpace />
        </div>;
        
        if(loading){
            return <div className={styles['unit-list']}>
                { headerComponent }
                <Loading tips='正在获取鸡场单元列表，请稍后...'/>
            </div>;
        }

        if(error) {
            return <div className={styles['unit-list']}>
                { headerComponent }
                <Result
                    img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                    title="获取失败"
                    message="网络错误，获取鸡场单元列表失败，请稍候再试！"
                />
            </div>;
        }

        return (<div className={styles['unit-list']}>
            { headerComponent }

            <div style={{height: clientHeight * 3 / 4}} className={styles['list-body']}>
                <WingBlank className={styles['second-header']}><Icon type={require('../../asserts/icon/video1.svg')}/>宣传视频</WingBlank>
                <WhiteSpace />
                { isExisted ? <video 
                    src={`http://www.chickenfarm.com.cn/video/farms/${farmId}`}
                    controls
                    width={clientWidth}
                    preload='auto'
                ></video> : <p className={styles['no-video-tips']}>暂无鸡场视频介绍！</p> }
                <WingBlank className={styles['second-header']}><Icon type={require('../../asserts/icon/unit.svg')}/>鸡场单元</WingBlank>
                <Flex wrap="wrap">
                    { unitList.length ? unitList.map(item => <Item unit={item} farmName={farmName}/>) : <Result
                        img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
                        title="提示"
                        message="暂无鸡场单元！"
                    /> }
                </Flex>
            </div>

            <Footer_Cont farmId={this.props.match.params.farmId} farmName={farmName}/>
        </div>);
    }
}

export default FarmUnit;
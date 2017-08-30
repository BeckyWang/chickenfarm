import React from 'react';
import { WingBlank, WhiteSpace, Icon, Button, Result, Toast } from 'antd-mobile';

import { getEggsOfChicken } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;
const clientWidth = document.documentElement.clientWidth;

let dateStorage = [];

class ChickenProduction extends React.Component {
    constructor() {
        super();

        this.state = {
        	eggList: [],
        	dateList: [],
        	loading: true,
        	error: false,
        	InfiniteCalendar: null,
        };

        this.onSelectDate = this.onSelectDate.bind(this);
    }

    componentWillMount() {
        const { chickenId } = this.props.match.params;
        (async () => {
            try {
            	const InfiniteCalendar = await import('react-infinite-calendar/umd/react-infinite-calendar.min.js');
    			await import('react-infinite-calendar/styles.css');
    			const eggList = await getEggsOfChicken(chickenId);
    			dateStorage = eggList.map(item => {
    				const date = item.createtime.split(' ')[0].split('-').map(val => +val);
    				return date;
    			});

                this.setState({
                	dateList: dateStorage.map(date => new Date(date[0], date[1] - 1, date[2])),
                	eggList,
                    loading: false,
                    InfiniteCalendar,
                })
            } catch(e) {
                this.setState({
                    loading: false,
                    error: true,
                })
            }
        })();
    }

    onSelectDate() {
    	this.setState({
    		dateList: dateStorage.map(date => new Date(date[0], date[1] - 1, date[2])),
    	});
    }

    render() {
    	const { eggList, dateList, loading, error, InfiniteCalendar } = this.state;
        const { chickenName} = this.props.location.state;

    	const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
	            <sapn onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></sapn>
                <span>鸡只产蛋详情</span>
                <span></span>
            </WingBlank>
            <WhiteSpace />
        </div>;

        if(loading) {
            return <div className={styles['production-container']}>
                { headerComponent }
                <Loading tips='正在获取产蛋信息，请稍后...'/>
            </div>;
        }

        return (
            <div className={styles['production-container']}>
            	{ headerComponent }
                { error ? <Result
	                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
	                title="获取失败"
	                message="网络错误，获取产蛋信息失败，请稍候再试！"
	            /> : <div>
	            	<WingBlank className={styles['tips']} style={{fontSize: '0.32rem'}}>
	            		<Icon type={require('../../asserts/icon/Chicken.svg')} className={styles['second-header-icon']}/>鸡只：{chickenName}
	            	</WingBlank>
	            	<WhiteSpace />
	    			<InfiniteCalendar.default
						width={clientWidth}
						height={clientHeight * 1 / 2}
						rowHeight={90}
						Component={InfiniteCalendar.withMultipleDates(InfiniteCalendar.Calendar)}
						selected={dateList}
						interpolateSelection={InfiniteCalendar.defaultMultipleDateInterpolation}
						displayOptions={{
					    	showTodayHelper: false,
					   	}}
						locale={{
							locale: require('date-fns/locale/zh_cn'),
							weekdays: ["日","一","二","三","四","五","六"],
							headerFormat: 'MMM D,dddd',
						}}
						theme={{
							selectionColor: date => {
							    let isSell = 0;

						    	for(let i=0; i < eggList.length; i++) {
						    		if(eggList[i].createtime.split(' ')[0] === date) {
						    			isSell = +eggList[i].state;
						    			break;
						    		}
						    	}

						    	return isSell ? '#38b0d2' : '#cdd021';
							},
							textColor: {
								default: '#333',
								active: '#FFF'
							},
							weekdayColor: '#49CA8F',
							headerColor: '#28BB78',
						}}
						onSelect={this.onSelectDate}
					/>
            		<WhiteSpace size='lg'/>
            		<WingBlank className={styles['tips']}>
            			蓝色背景表示当天产蛋并售出，黄色背景表示当天产蛋蛋但是未售出，无背景色表示当日未产蛋。
            		</WingBlank>
            		<WhiteSpace />
            		<WingBlank className={styles['tips']}>翻阅日历可了解更多信息。</WingBlank>
                    <WhiteSpace />
	    		</div> }
            </div>
        );
    }
}

export default ChickenProduction;
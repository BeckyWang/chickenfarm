import React from 'react';
import { WingBlank, WhiteSpace, Icon, Result } from 'antd-mobile';

import { queryVideo } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

const clientWidth = document.documentElement.clientWidth;

class Video extends React.Component {
	constructor() {
        super();

        this.state = {
        	loading: true,
        	isExisted: true,
        };
    }

	componentWillMount() {
        (async () => {
            try {
            	const { date, unitName } = this.props.match.params;
            	const { status } = await queryVideo(date + unitName);

                this.setState({
                    isExisted: status,
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

    render() {
        const { date, unitName } = this.props.match.params;
        const { loading, error, isExisted } = this.state;

        const headerComponent = <div>
            <WhiteSpace size='lg'/>
            <WingBlank className={styles['public-header']}>
                <span onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left"/></span>
                <span>视频播放</span>
                <span></span>
            </WingBlank>
            <WhiteSpace size='lg'/>
        </div>;

        if(loading){
            return <div className={styles['video-container']}>
                { headerComponent }
                <Loading tips='正在获取视频信息，请稍后...'/>
            </div>;
        }

        if(error) {
            return <div className={styles['video-container']}>
                { headerComponent }
                <Result
                    img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                    title="获取失败"
                    message="网络错误，获取视频信息失败，请稍候再试！"
                />
            </div>;
        } 

        return (
            <div className={styles['video-container']}>
                { headerComponent }
                { isExisted ? <video 
		        	src={`http://www.chickenfarm.com.cn/video/${date + unitName}`}
		        	controls
		        	width={clientWidth}
		        	preload='auto'
		        ></video> : <Result
		            img={<Icon type={require('../../asserts/icon/info-red.svg')} className={styles['error-tip']}/>}
		            title="提示"
		            message="该日期暂无视频信息"
		        />}
		        
            </div>
        );
    }
}

export default Video;
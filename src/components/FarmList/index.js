import React from 'react';
import { SearchBar, Flex, Result, Icon } from 'antd-mobile';

import Item from './Item';
import Loading from '../public/Loading';
import { Footer_Cont } from '../../containers/collection';

import { getFarms } from '../../unit/fetch';

import styles from './styles';

const clientHeight = document.documentElement.clientHeight;
let dataStorage = [];

class FarmList extends React.Component {
	constructor() {
        super();

        this.state = {
            searchValue: '',
            farmList: [],
            loading: true,
            error: false,
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
        const { searchValue, farmList } = this.state;
        let result = [];

        if(searchValue === '') {
            this.setState({
                farmList: dataStorage,
            })
            return;
        }

        for (let val of farmList) {
            if(val.cfname.search(searchValue) > -1){
                result.push(val);
            }
        }

        this.setState({
            farmList: result,
        })
    }

    componentWillMount() {
        (async () => {
            try {
                const response = await getFarms();

                dataStorage = response;
                this.setState({
                    farmList: response,
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
        const { farmList, loading, error } = this.state;
        let bodyComponent = null;
        
        if(loading){
            bodyComponent = <Loading tips='正在获取鸡场列表，请稍后...'/>
        } else {
            bodyComponent = error ? <Result
                img={<Icon type="cross-circle-o" style={{ fill: '#F13642' }} className={styles['error-tip']}/>}
                title="获取失败"
                message="网络错误，获取鸡场列表失败，请稍候再试！"
            /> : <Flex wrap="wrap">{farmList.length && farmList.map(item => <Item farm={item} />)}</Flex>
        }

        return (<div className={styles['farm-list']}>
            <div className={styles['list-header']}>
                <SearchBar
                    value={this.state.searchValue}
                    placeholder="输入鸡场名称"
                    onSubmit={this.onSubmit}
                    onClear={this.onClear}
                    onCancel={this.onCancel}
                    onChange={this.onChange}
                    className={styles['search-bar']}
                />
            </div>

            <div style={{height: clientHeight * 3 / 4}} className={styles['list-body']}>
                { bodyComponent }
            </div>

            <Footer_Cont />
        </div>);
    }
}

export default FarmList;
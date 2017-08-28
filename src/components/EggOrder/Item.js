import React from 'react';
import { Flex, ListView } from 'antd-mobile';

import { renderMobile } from '../../unit/tool';

import styles from './styles';

const Item = ({keyValue, info}) => {
	const title = keyValue.split('/');
	return <div className={styles['order-item']}>
		<div className={styles['info']}>
            <span>单元：{title[0]}</span>
            <span>日期：{title[1]}</span>
        </div>

    	<Flex className={styles['table-header']}>
            <span style={{width: '40%'}}>蛋号</span>
            <span style={{width: '20%'}}>母鸡</span>
            <span style={{width: '15%'}}>售价</span>
            <span style={{width: '25%'}}>认养者</span>
        </Flex>
        
        <div>
        	{
	        	info.map(({cname, eggsell, mobile, ename}) => <Flex className={styles['row']}>
	                <span style={{width: '40%'}}>{ename}</span>
		            <span style={{width: '20%'}}>{cname}</span>
		            <span style={{width: '15%'}}>{eggsell}</span>
		            <span style={{width: '25%'}}>{mobile ? renderMobile(mobile) : ''}</span>
	            </Flex>)
	        }
        </div>
	</div>;
};

export default Item;
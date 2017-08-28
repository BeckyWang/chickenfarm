import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'antd-mobile';

import styles from './styles';

const Item = ({info: {raid, address, phone, consignee}, toDelete}) => {
	return	<div className={styles['address-item']}>
		<div className={styles['info']}>
			<span>{consignee}</span>
			<span>{phone}</span>
		</div>
		<div className={styles['address']}>{address}</div>
		
		<div className={styles['operation']}>
			<Link to={`/weixin/cultivation/address/edit/${raid}`}><Icon type={require('../../asserts/icon/edit.svg')} className={styles['icon']}/>编辑</Link>
			<a onClick={() => toDelete(raid)}><Icon type={require('../../asserts/icon/delete.svg')} className={styles['icon']}/>删除</a>
		</div>
	</div>;
};

export default Item;
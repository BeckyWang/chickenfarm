import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd-mobile';

import styles from './styles';

const Item = ({farm: {cfid, cfname}}) => {
	return	<div className={styles['farm-item']}>
		<Link to={{
			pathname: `/weixin/cultivation/farms/${cfid}`,
			state: {name: cfname}
		}}>
			<Button>{cfname}</Button>
		</Link>
	</div>;
};

export default Item;
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd-mobile';

import styles from './styles';

const Item = ({farmName, unit: {cuid, cname}}) => {
	return	<div className={styles['unit-item']}>
		<Link to={{
			pathname: `/weixin/cultivation/farms/units/${cuid}`,
			state: {farmName, unitName: cname}
		}}>
			<Button>{cname}</Button>
		</Link>
	</div>;
};

export default Item;
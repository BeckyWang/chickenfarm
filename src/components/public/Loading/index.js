import React from 'react';

import { Icon } from 'antd-mobile';

import styles from './styles';

export default ({tips}) => {
    return (
         <div className={styles['loading']}>
            <Icon type='loading'/>
            <p>
                {tips}
            </p>
         </div>
    );
};
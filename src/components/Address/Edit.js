import React from 'react';
import { createForm } from 'rc-form';
import { WingBlank, WhiteSpace, Icon, InputItem, List, Button, Toast, TextareaItem } from 'antd-mobile';

import { addAddress, getAddress, updateAddress } from '../../unit/fetch';
import Loading from '../public/Loading';

import styles from './styles';

class AddressEdit extends React.Component {
    constructor() {
        super();

        this.state = {
            addressInfo: {},
        }

        this.toSave = this.toSave.bind(this);
    }

    componentWillMount() {
        (async () => {
            const { path, params } = this.props.match;
            const isEdit = String.prototype.match.call(path, /\/edit\//);
            if(isEdit) {
                try {
                    this.setState({
                        addressInfo: await getAddress(params.addressId),
                    });
                } catch({info = '获取地址详情失败'}) {
                    Toast.fail(info, 1);
                }
            }
        })();
    }

    toSave() {
        const isEdit = String.prototype.match.call(this.props.match.path, /\/edit\//);

        this.props.form.validateFields(async (errors, values) => {
            if(!errors) {
                try {
                    if(isEdit) {
                        const info = {
                            ...values,
                            addressId: this.props.match.params.addressId,
                        };
                        await updateAddress(info);
                    } else {
                        await addAddress(values);
                    }

                    Toast.success('保存成功！', 1, () => {
                        this.props.history.goBack();
                    });
                } catch({info = '保存失败，请稍后重试！'}) {
                    Toast.fail(info, 1);
                }
            }
        });

    }

    render() {
        const { raid, consignee, phone, address } = this.state.addressInfo;
    	const { getFieldProps, getFieldError } = this.props.form;
        const isEdit = String.prototype.match.call(this.props.match.path, /\/edit\//);

        return (
            <div>
                <div>
	        		<WhiteSpace size='lg'/>
	        		<WingBlank className={styles['public-header']}>
		            	<span onClick={() => this.props.history.goBack()} className={styles['back-icon']}><Icon type="left" /></span>
	                    <span>{isEdit ? '编辑地址' : '添加新地址'}</span>
	                    <span></span>
		            </WingBlank>
	        		<WhiteSpace size='lg'/>
	        	</div>

                <List>
                    <InputItem 
                        {...getFieldProps('consignee', {
                            initialValue: consignee,
                            rules: [{
                                required: true, 
                                message: '姓名不能为空!'
                            }],
                        })}
                        placeholder="请输入真实姓名"
                        error={!!getFieldError('consignee')}
                        onErrorClick={() => {
                            Toast.fail(getFieldError('consignee'), 1);
                        }}
                    >收货人</InputItem>

                    <InputItem
                        {...getFieldProps('phone', {
                            initialValue: phone,
                            rules: [{ 
                                required: true,
                                message: '手机号码不能为空!'
                            }, {
                                pattern: /^1[34578]\d{9}$/,
                                message: '无效的手机号码！'
                            }],
                            validateTrigger: 'onBlur',
                        })}
                        placeholder="请输入手机号码"
                        error={!!getFieldError('phone')}
                        onErrorClick={() => {
                            Toast.fail(getFieldError('phone'), 1);
                        }}
                    >联系电话</InputItem>

                    <TextareaItem
                        {...getFieldProps('address', {
                            initialValue: address,
                            rules: [{ 
                                required: true,
                                message: '收货地址不能为空!'
                            }],
                            validateTrigger: 'onBlur',
                        })}
                        rows={4}
                        title="收货地址"
                        placeholder="请输入收货地址"
                        error={!!getFieldError('address')}
                        onErrorClick={() => {
                            Toast.fail(getFieldError('address'), 1);
                        }}
                    />
                </List>
                
                <WhiteSpace size='lg'/>
                <Button type="primary" size="sm" onClick={this.toSave}>保存</Button>
            </div>
        );
    }
}

export default createForm()(AddressEdit);

import React from 'react';
import { createForm } from 'rc-form';
import { WingBlank, WhiteSpace, Icon, List, InputItem, Button, Toast, Popup, Flex } from 'antd-mobile';

import { updateUser } from '../../unit/fetch';

import styles from './styles';

const isIPhone = new RegExp('\\biPhone\\b|\\biPod\\b', 'i').test(window.navigator.userAgent);
let maskProps;
if (isIPhone) {
  // Note: the popup content will not scroll.
  maskProps = {
    onTouchStart: e => e.preventDefault(),
  };
}

class Register extends React.Component {
	constructor() {
        super();

        this.toRegister = this.toRegister.bind(this);
        this.selectGender = this.selectGender.bind(this);
        this.showGenderSelector = this.showGenderSelector.bind(this);
        this.selectIdcardType = this.selectIdcardType.bind(this);
        this.showIdCardTypeSelector = this.showIdCardTypeSelector.bind(this);
    }

    toRegister() {
    	this.props.form.validateFields(async (errors, values) => {
            if(!errors) {
                const info = {};

                for (let [key, value] of Object.entries(values) ) {
                    if (value) {
                        info[key] = value;
                    }
                }

                info.gender = info.gender === '男' ? 0 : 1;

            	try {
        			await updateUser(info);
                    this.props.updateIsUser(true);
                    this.props.history.goBack();
        		} catch({info = '注册失败，请稍后重试！'}) {
    				Toast.fail(info, 1);
        		}
            }
        });
    }

    selectGender(value) {
    	this.props.form.setFieldsValue({gender: value});
    	Popup.hide();
    }

    showGenderSelector() {
    	Popup.show(<List renderHeader={() => <Flex justify="between" className={styles['popup-title']}>
            <span>请选择您的性别</span>
            <Icon type="cross" onClick={() => Popup.hide()} />
        </Flex>}>
            <List.Item
                onClick={() => this.selectGender('男')}
            >男</List.Item>
            <List.Item
                onClick={() => this.selectGender('女')}
            >女</List.Item>
        </List>, { animationType: 'slide-up', maskProps });
    }

    selectIdcardType(value) {
    	this.props.form.setFieldsValue({idcardType: value});
    	Popup.hide();
    }

    showIdCardTypeSelector() {
    	Popup.show(<List renderHeader={() => <Flex justify="between" className={styles['popup-title']}>
            <span>请选择您的证件类型</span>
            <Icon type="cross" onClick={() => Popup.hide()} />
        </Flex>} >
            <List.Item
                onClick={() => this.selectIdcardType('二代身份证')}
            >二代身份证</List.Item>
            <List.Item
                onClick={() => this.selectIdcardType('护照')}
            >护照</List.Item>
            <List.Item
                onClick={() => this.selectIdcardType('军官证')}
            >军官证</List.Item>
        </List>, { animationType: 'slide-up', maskProps });
    }

    render() {
    	const { getFieldProps, getFieldError } = this.props.form;
        console.log(this.props);
        return (<div className={styles['register-container']}>
        	<WhiteSpace />
            <List renderHeader={() => <sapn className={styles['title']}>注册会员</sapn>}>
            	<InputItem 
            		{...getFieldProps('realname', {
            			rules: [{required: true, message: '姓名不能为空!'}],
            		})}
					placeholder="请输入真实姓名"
					error={!!getFieldError('realname')}
					onErrorClick={() => {
						Toast.fail(getFieldError('realname'), 1);
					}}
            	>姓名<span className={styles['required']}>*</span></InputItem>

            	<InputItem 
            		{...getFieldProps('gender', {
            			rules: [{required: true, message: '请选择性别!'}],
            		})}
            		editable={false}
					placeholder="请选择"
					error={!!getFieldError('gender')}
					onErrorClick={() => {
						Toast.fail(getFieldError('gender'), 1);
					}}
					onClick={this.showGenderSelector}
            	>性别<span className={styles['required']}>*</span></InputItem>

            	<InputItem
					{...getFieldProps('idcardType')}
					editable={false}
					placeholder="请选择证件类型"
					onClick={this.showIdCardTypeSelector}
				>证件类型</InputItem>

				<InputItem
					{...getFieldProps('idcard', {
						rules: [{
                            pattern: /^[1-9]\d{5}[1-9]\d{3}(((0[13578]|1[02])(0[1-9]|[12]\d|3[0-1]))|((0[469]|11)(0[1-9]|[12]\d|30))|(02(0[1-9]|[12]\d)))(\d{4}|\d{3}[xX])$/,
                            message: '无效的身份证号！'
                        }],
                        validateTrigger: 'onBlur',
					})}
					placeholder="请输入证件号"
					error={!!getFieldError('idcard')}
					onErrorClick={() => {
						Toast.fail(getFieldError('idcard'), 1);
					}}
				>证件号</InputItem>

            	<InputItem
					{...getFieldProps('mobile', {
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
					error={!!getFieldError('mobile')}
					onErrorClick={() => {
						Toast.fail(getFieldError('mobile'), 1);
					}}
				>手机号<span className={styles['required']}>*</span></InputItem>

				<InputItem
					{...getFieldProps('email', {
						rules: [{
                            pattern: /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/,
                            message: '无效的邮箱！'
                        }],
                        validateTrigger: 'onBlur',
					})}
					placeholder="请输入邮箱"
					error={!!getFieldError('email')}
					onErrorClick={() => {
						Toast.fail(getFieldError('email'), 1);
					}}
				>邮箱</InputItem>

				<InputItem
					{...getFieldProps('alipay')}
					placeholder="请输入账号（用于提现财富）"
				>微信账号</InputItem>
            </List>

            <div className={styles['submit-button']}>
            	<WingBlank size="lg">
            		<Button type="primary" size="sm" onClick={this.toRegister}>注册</Button>
            	</WingBlank>
            </div>
        </div>);
    }
}

export default createForm()(Register);
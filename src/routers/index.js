import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import actions from '../actions';

import { 
    MyAdopted_Cont, MyFocused_Cont,
    Register_Cont, 
    FarmList_Cont, FarmUnitList_Cont, FarmUnitView_Cont, 
    EggList_Cont, 
    ChickenProduction_Cont,
    ChickenAdopt_Cont, 
    ChickenDelay_Cont,
    ChickenOrder_Cont, 
    ChickenEat_Cont, 
    EggOrder_Cont, EggOrderPay_Cont,
    AddressList_Cont, AddressEdit_Cont, AddressManage_Cont,
    PersonalCenter_Cont, MyClient_Cont, MyTreasure_Cont, Withdraw_Cont,
    Video_Cont,
} from '../containers/collection'

import { getQueryString } from '../unit/tool';
import { getFakeAccess, updateAccess } from '../unit/fetch';

const getAccess = code => () => updateAccess({code});

const mapStateToProps = state => {
    return {
        openId: state.get('openId'),
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        updateAccess: (code)=> {
            dispatch(getAccess(code)).then(({access_token, openid, isUser, jsapi_ticket}) => {
            	dispatch(actions.updateAccessToken(access_token));
                dispatch(actions.updateJsapiTicket(jsapi_ticket));
            	dispatch(actions.updateOpenId(openid));
                dispatch(actions.updateIsUser(isUser));
            	window.sessionStorage.setItem('accessStr', JSON.stringify({
                    accessToken: access_token,
                    openId: openid,
                    isUser,
                    jsapiTicket: jsapi_ticket,
                }));
            });
        },
        updateAccessToken: token => {
            dispatch(actions.updateAccessToken(token));
        },
        updateOpenId: openId => {
            dispatch(actions.updateOpenId(openId));
        },
        updateIsUser: isUser => {
            dispatch(actions.updateIsUser(isUser));
        },
        updateJsapiTicket: jsapiTicket => {
            dispatch(actions.updateJsapiTicket(jsapiTicket));
        },
        updateReferrer: referrer => {
            dispatch(actions.updateReferrer(referrer));
        }
    }
}

class AppRouter extends React.Component {
    componentWillMount() {
    	const code = getQueryString('code'),
            state = getQueryString('state'),
        	accessStr = window.sessionStorage.getItem('accessStr'),
            referrer = window.sessionStorage.getItem('referrer');

        if(this.props.openId) {
        	return;
        }

        if(accessStr) {
        	const { accessToken, openId, isUser, jsapiTicket } = JSON.parse(accessStr);
            this.props.updateAccessToken(accessToken);
            this.props.updateOpenId(openId);
            this.props.updateIsUser(isUser);
            this.props.updateJsapiTicket(jsapiTicket);
        } else {
        	this.props.updateAccess(code);
        }

        if(referrer) {
            this.props.updateReferrer(referrer);           
        } else {
            if(state) {
                window.sessionStorage.setItem('referrer', state);
                this.props.updateReferrer(state);
            }
        } 
    }

    render() {
        return (
	        <ConnectedRouter history={this.props.history} >
		        <Switch>
                    <Route exact path="/weixin/cultivation/register" component={Register_Cont} />

                    <Route exact path="/weixin/cultivation/my-adopted" component={MyAdopted_Cont} />
                    <Route exact path="/weixin/cultivation/farms/:farmId/my-adopted" component={MyAdopted_Cont} />

                    <Route exact path="/weixin/cultivation/my-focused" component={MyFocused_Cont} />
                    <Route exact path="/weixin/cultivation/farms/:farmId/my-focused" component={MyFocused_Cont} />

			        <Route exact path="/weixin/cultivation/farms" component={FarmList_Cont} />
                    <Route exact path="/weixin/cultivation/farms/:farmId" component={FarmUnitList_Cont} />

                    <Route exact path="/weixin/cultivation/farms/units/:unitId" component={FarmUnitView_Cont} />
                    <Route exact path="/weixin/cultivation/farms/units/:unitId/eggs/:date" component={EggList_Cont} />

                    <Route exact path="/weixin/cultivation/chicken/production/:chickenId" component={ChickenProduction_Cont} />

                    <Route exact path="/weixin/cultivation/pay" render={props => {
                        const { location: {state}} = props;
                        switch(state.type) {
                            case 'chicken_adopt':
                                return <ChickenAdopt_Cont {...props}/>;
                                break;
                            case 'chicken_delay':
                                return <ChickenDelay_Cont {...props}/>;
                                break;
                            case 'chicken_order':
                                return <ChickenOrder_Cont {...props}/>;
                                break;
                            case 'chicken_eat':
                                return <ChickenEat_Cont {...props}/>;
                                break;
                            case 'egg_order':
                                return <EggOrderPay_Cont {...props}/>;
                                break;
                        }
                    }} />

                    <Route exact path="/weixin/cultivation/egg/order/farms/all" component={EggOrder_Cont} />
                    <Route exact path="/weixin/cultivation/egg/order/farms/:farmId" component={EggOrder_Cont} />

                    <Route exact path="/weixin/cultivation/address" component={AddressList_Cont} />
                    <Route exact path="/weixin/cultivation/address/manage" component={AddressManage_Cont} />
                    <Route exact path="/weixin/cultivation/address/add" component={AddressEdit_Cont} />
                    <Route exact path="/weixin/cultivation/address/edit/:addressId" component={AddressEdit_Cont} />

                    <Route exact path="/weixin/cultivation/person_center" component={PersonalCenter_Cont} />
                    <Route exact path="/weixin/cultivation/person_center/client" component={MyClient_Cont} />
                    <Route exact path="/weixin/cultivation/person_center/treasure" component={MyTreasure_Cont} />
                    <Route exact path="/weixin/cultivation/person_center/withdraw" component={Withdraw_Cont} />

		            <Route exact path="/weixin/cultivation/unit/:unitName/video/:date" component={Video_Cont} />
		        </Switch>
	        </ConnectedRouter>
	    );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppRouter);
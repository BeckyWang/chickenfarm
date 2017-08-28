import { combineReducers } from 'redux-immutable';
import { routerReducer } from 'react-router-redux';

import accessToken from './accessToken';
import openId from './openId';
import isUser from './isUser';
import jsapiTicket from './jsapiTicket';
import address from './address';
import referrer from './referrer';

const rootReducer = combineReducers({
	accessToken,
	openId,
	isUser,
	jsapiTicket,
	address,
	referrer,
    router: routerReducer
});

export default rootReducer;